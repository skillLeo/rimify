<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use App\Models\AdminUser;
use App\Models\Vehicle;
use Illuminate\Foundation\Http\FormRequest;

/**
 * Fahrzeuge (VehiclePolicy; the route names the step): the list and its filters, one vehicle, and
 * the legal data a verdict needs. Axle loads and top speed are read off the Zulassungsbescheinigung
 * (fields 8.1, 8.2 and T); a vehicle with all three leaves the review queue, one without any of them
 * can never be told a wheel fits (R-03).
 */
class VehicleRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user('admin');
        $vehicle = $this->route('vehicle');

        if (! $user instanceof AdminUser) {
            return false;
        }

        return match ($this->step()) {
            'update' => $vehicle instanceof Vehicle && $user->can('update', $vehicle),
            // The form to type a car from its papers (D-296); the car itself is sent through ManualVehicleRequest.
            'create' => $user->can('create', Vehicle::class),
            default => $user->can('viewAny', Vehicle::class),
        };
    }

    /** `1.200` is how a German writes 1200 kg: the thousands dot and spaces are read past. */
    protected function prepareForValidation(): void
    {
        if ($this->step() !== 'update') {
            return;
        }

        foreach (['axle_load_front_kg', 'axle_load_rear_kg', 'max_speed_kmh'] as $key) {
            $value = $this->input($key);

            if (is_string($value) && preg_match('/^\s*\d{1,3}(?:[.\s\x{00A0}]\d{3})+\s*$/u', $value) === 1) {
                $this->merge([$key => (string) preg_replace('/\D/', '', $value)]);
            }
        }
    }

    /** @return array<string, list<mixed>> */
    public function rules(): array
    {
        if ($this->step() === 'update') {
            return [
                'axle_load_front_kg' => ['nullable', 'integer', 'min:300', 'max:5000'],
                'axle_load_rear_kg' => ['nullable', 'integer', 'min:300', 'max:5000'],
                'max_speed_kmh' => ['nullable', 'integer', 'min:40', 'max:420'],
            ];
        }

        return [
            'q' => ['nullable', 'string', 'max:80'],
            'marke' => ['nullable', 'string', 'max:80'],
            'seite' => ['nullable', 'integer', 'min:1', 'max:100000'],
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return [
            'axle_load_front_kg.*' => 'Die Achslast vorn bitte in Kilogramm, zwischen 300 und 5.000 (Feld 8.1).',
            'axle_load_rear_kg.*' => 'Die Achslast hinten bitte in Kilogramm, zwischen 300 und 5.000 (Feld 8.2).',
            'max_speed_kmh.*' => 'Die Höchstgeschwindigkeit bitte in km/h, zwischen 40 und 420 (Feld T).',
            'q.*' => 'Der Suchbegriff ist zu lang.',
            'marke.*' => 'Diese Marke gibt es nicht.',
            'seite.*' => 'Diese Seite gibt es nicht.',
        ];
    }

    /** @return array{axle_load_front_kg: int|null, axle_load_rear_kg: int|null, max_speed_kmh: int|null} */
    public function legalData(): array
    {
        $int = fn (string $key): ?int => $this->validated($key) === null ? null : (int) $this->validated($key);

        return [
            'axle_load_front_kg' => $int('axle_load_front_kg'),
            'axle_load_rear_kg' => $int('axle_load_rear_kg'),
            'max_speed_kmh' => $int('max_speed_kmh'),
        ];
    }

    public function step(): string
    {
        $name = (string) $this->route()?->getName();

        return substr($name, (int) strrpos($name, '.') + 1);
    }

    public function admin(): AdminUser
    {
        $user = $this->user('admin');

        if (! $user instanceof AdminUser) {
            abort(403);
        }

        return $user;
    }
}
