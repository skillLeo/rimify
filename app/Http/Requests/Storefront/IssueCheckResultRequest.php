<?php

declare(strict_types=1);

namespace App\Http\Requests\Storefront;

use App\Domain\Fitment\Resolver\FitmentResolver;
use App\Domain\Fitment\Resolver\WheelSets;
use App\Domain\Storefront\VehicleContext;
use App\Enums\CatalogueStatus;
use App\Models\CheckResult;
use App\Models\WheelConfig;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

/**
 * „RIMIFY-Check drucken“: the wheel size the product page shows, for the car the customer chose. The car
 * comes from their own vehicle cookie, never from the form — a check is only ever about the car the shop
 * answered for. The policy is asked on every call (R-11).
 */
class IssueCheckResultRequest extends FormRequest
{
    public function authorize(): bool
    {
        return Gate::allows('create', CheckResult::class);
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'wheelConfigId' => [
                'required',
                'integer',
                'min:1',
                Rule::exists('wheel_configs', 'id')->whereNull('deleted_at'),
            ],
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return [
            'wheelConfigId.*' => 'Diese Felgengröße gibt es nicht mehr. Wähle bitte eine andere.',
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            if ($validator->errors()->isEmpty() && $this->vehicleId() === null) {
                $validator->errors()->add('wheelConfigId', 'Wähle zuerst dein Fahrzeug – der RIMIFY-Check gilt immer für ein bestimmtes Auto.');
            }

            if ($validator->errors()->isEmpty() && ! $this->published()) {
                $validator->errors()->add('wheelConfigId', 'Diese Felge ist gerade nicht im Shop. Wähle bitte eine andere.');
            }

            // Frozen, the answer for one version would say „freigegeben“ for one axle of what only goes on as a set.
            if ($validator->errors()->isEmpty() && $this->onlyInSet()) {
                $validator->errors()->add('wheelConfigId', 'Diese Ausführung gibt es für dein Fahrzeug nur zusammen mit einer anderen. Dafür können wir noch keinen RIMIFY-Check ausstellen. Die Antwort steht auf der Produktseite.');
            }
        });
    }

    private function onlyInSet(): bool
    {
        $vehicleId = (int) $this->vehicleId();
        $configId = $this->wheelConfigId();

        return app(WheelSets::class)->of($vehicleId, [$configId => app(FitmentResolver::class)->resolve($vehicleId, $configId)])->onlyInSet($configId);
    }

    public function vehicleId(): ?int
    {
        $raw = $this->cookie(VehicleContext::COOKIE);

        return VehicleContext::decode(is_string($raw) ? $raw : null)?->vehicleId;
    }

    public function wheelConfigId(): int
    {
        return (int) $this->validated('wheelConfigId');
    }

    private function published(): bool
    {
        return WheelConfig::query()
            ->whereKey((int) $this->input('wheelConfigId'))
            ->whereHas('wheelModel', static fn ($q) => $q->where('status', CatalogueStatus::Published->value))
            ->exists();
    }
}
