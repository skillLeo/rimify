<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Several photographs per colour, in an order a person sets (COMPLIANCE row 23; the client sent two photos
 * per colour for the Borbet DB8GT2). Each photo keeps its own manifest and its own alt text.
 *
 * `wheel_finishes.image_manifest` stays what every reader already reads — the cover, now composed by
 * FinishImages from the first photo, with the others as its `views` — so tiles, lists and the Freigabe-Check
 * do not change. A colour's photos go with the colour (cascade): they are pictures, not compliance data.
 *
 * Existing uploaded photographs (`kind: photo`) become the first photo of their colour. Drawn placeholders
 * are not photographs and stay where they are.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('wheel_finish_images', function (Blueprint $t): void {
            $t->id();
            $t->foreignId('wheel_finish_id')->constrained('wheel_finishes')->cascadeOnDelete();
            $t->unsignedSmallInteger('position');
            $t->json('manifest');
            // As long as WheelImageRequest allows.
            $t->string('alt_de', 200);
            $t->timestamps();

            $t->index(['wheel_finish_id', 'position']);
        });

        $now = now();

        foreach (DB::table('wheel_finishes')->whereNotNull('image_manifest')->get(['id', 'image_manifest', 'image_alt_de']) as $finish) {
            $manifest = json_decode((string) $finish->image_manifest, true);

            if (! is_array($manifest) || ($manifest['kind'] ?? null) !== 'photo') {
                continue;
            }

            unset($manifest['views']);

            DB::table('wheel_finish_images')->insert([
                'wheel_finish_id' => $finish->id,
                'position' => 1,
                'manifest' => json_encode($manifest, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE),
                'alt_de' => mb_substr((string) ($finish->image_alt_de ?? ''), 0, 200),
                'created_at' => $now,
                'updated_at' => $now,
            ]);
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('wheel_finish_images');
    }
};
