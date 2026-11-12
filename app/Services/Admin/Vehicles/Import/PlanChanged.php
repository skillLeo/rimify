<?php

declare(strict_types=1);

namespace App\Services\Admin\Vehicles\Import;

use RuntimeException;

/**
 * The import planned the file again and found it no longer reads the way the Probelauf did — the cars changed in the
 * meantime. Thrown inside the import's transaction, so nothing it wrote stays (VehicleImporter::apply).
 */
final class PlanChanged extends RuntimeException {}
