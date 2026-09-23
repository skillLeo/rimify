@php
    /*
     * The release window.
     *
     * Rendered by ErrorPage for every 503, and pre-rendered into a static file by
     * `php artisan down --render="errors::503"`, which is served before the framework boots. It
     * therefore says nothing that needs the application to be running.
     *
     * It does not promise a duration. Nobody can keep that promise: a release takes as long as it
     * takes, and a page that says "nur wenige Minuten" is wrong the moment it is not.
     */
    $status = $status ?? 503;
    $retryAfter = $retryAfter ?? null;

    $wait = null;

    if (is_int($retryAfter) && $retryAfter > 0) {
        $wait = $retryAfter < 60
            ? 'Der Server bittet um '.$retryAfter.' Sekunden Geduld.'
            : 'Der Server bittet um rund '.(int) ceil($retryAfter / 60).' Minuten Geduld.';
    }
@endphp

@include('errors._standalone', [
    'status' => $status,
    'title' => 'RIMIFY ist gerade in Wartung.',
    'lead' => 'Wir spielen eine Aktualisierung ein. Solange sind die Fahrzeugsuche, die Felgen und der Warenkorb nicht erreichbar.',
    'detail' => trim(($wait !== null ? $wait.' ' : 'Wie lange das dauert, können wir dir nicht versprechen. ')
        .'Lad diese Seite später noch einmal, oder schreib uns, wenn es eilt.'),
])
