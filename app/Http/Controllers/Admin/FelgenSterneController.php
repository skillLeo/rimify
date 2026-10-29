<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StatedRatingRequest;
use App\Models\WheelModel;
use App\Services\Admin\Catalogue\StatedRatings;
use Illuminate\Http\RedirectResponse;

/**
 * Katalog › Felgen › one Felge › „Sterne von Hand“ (#19, D-344): stars typed for the rim, with the sentence that says
 * where they come from. Saved beside the Felge's own form, as its photographs are — never held back by an unsaved form,
 * never lost to one. WheelModelPolicy::rate through StatedRatingRequest (R-11).
 */
class FelgenSterneController extends Controller
{
    public const SAVED = 'Sterne gespeichert. Der Shop zeigt sie unter dem Namen der Felge, mit deinem Satz daneben.';

    public const REMOVED = 'Sterne entfernt. Der Shop zeigt sie nicht mehr.';

    public const NOTHING = 'Diese Felge hat keine Sterne von Hand – entfernt wurde nichts.';

    public function update(StatedRatingRequest $request, WheelModel $model, StatedRatings $ratings): RedirectResponse
    {
        $ratings->state($model, $request->rating(), $request->count(), $request->origin(), $request->admin());

        return back()->with('toast', self::SAVED);
    }

    public function destroy(StatedRatingRequest $request, WheelModel $model, StatedRatings $ratings): RedirectResponse
    {
        return back()->with('toast', $ratings->remove($model, $request->admin()) ? self::REMOVED : self::NOTHING);
    }
}
