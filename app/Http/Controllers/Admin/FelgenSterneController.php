<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StatedDisclosureRequest;
use App\Http\Requests\Admin\StatedRatingRequest;
use App\Models\WheelModel;
use App\Services\Admin\Catalogue\StatedRatings;
use Illuminate\Http\RedirectResponse;

/**
 * Katalog › Felgen › one Felge › „Sterne von Hand“ (#19, D-344, D-345): stars typed for the rim, and the one sentence that
 * stands beside every rim's typed stars in the shop. Saved beside the Felge's own form, as its photographs are — never
 * held back by an unsaved form, never lost to one. WheelModelPolicy::rate through the Form Requests (R-11).
 */
class FelgenSterneController extends Controller
{
    public const SAVED = 'Sterne gespeichert. Der Shop zeigt sie unter dem Namen der Felge, mit dem Hinweis daneben.';

    public const REMOVED = 'Sterne entfernt. Der Shop zeigt sie nicht mehr.';

    public const NOTHING = 'Diese Felge hat keine Sterne von Hand – entfernt wurde nichts.';

    public const DISCLOSED = 'Hinweis gespeichert. Er steht neben den Sternen jeder Felge.';

    public const SILENCED = 'Hinweis geleert. Ohne ihn zeigt der Shop keine Sterne von Hand mehr.';

    public function update(StatedRatingRequest $request, WheelModel $model, StatedRatings $ratings): RedirectResponse
    {
        $ratings->state($model, $request->rating(), $request->count(), $request->admin());

        return back()->with('toast', StatedRatings::disclosure() === '' ? self::SAVED.' '.self::SILENCED : self::SAVED);
    }

    public function destroy(StatedRatingRequest $request, WheelModel $model, StatedRatings $ratings): RedirectResponse
    {
        return back()->with('toast', $ratings->remove($model, $request->admin()) ? self::REMOVED : self::NOTHING);
    }

    public function disclosure(StatedDisclosureRequest $request, StatedRatings $ratings): RedirectResponse
    {
        $ratings->setDisclosure($request->disclosure(), $request->admin());

        return back()->with('toast', $request->disclosure() === '' ? self::SILENCED : self::DISCLOSED);
    }
}
