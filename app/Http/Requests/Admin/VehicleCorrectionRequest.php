<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use App\Models\AdminUser;
use App\Models\Vehicle;

/**
 * Correcting a vehicle typed by hand (the admin audit's F-17): the same fields, rules and sentences as typing it
 * (ManualVehicleRequest) — and the twin it may not become is any other car with its HSN, TSN and variant, never itself.
 * Authorised as a change to the vehicle (VehiclePolicy::update); whether this vehicle may still be corrected is the
 * controller's question, asked again under a lock (VehicleCorrection::refusal).
 */
class VehicleCorrectionRequest extends ManualVehicleRequest
{
    public function authorize(): bool
    {
        $user = $this->user('admin');
        $vehicle = $this->route('vehicle');

        return $user instanceof AdminUser && $vehicle instanceof Vehicle && $user->can('update', $vehicle);
    }

    /** Another car with this HSN, TSN and variant — a removed one included (R-04), this one never. */
    public function twin(): ?Vehicle
    {
        $vehicle = $this->route('vehicle');

        return Vehicle::withTrashed()
            ->where('hsn', str_pad((string) $this->validated('hsn'), 4, '0', STR_PAD_LEFT))
            ->where('tsn', mb_strtoupper((string) $this->validated('tsn')))
            ->where('variant', trim((string) $this->validated('variant')))
            ->when($vehicle instanceof Vehicle, static fn ($q) => $q->whereKeyNot($vehicle instanceof Vehicle ? $vehicle->id : 0))
            ->first();
    }
}
