<?php

declare(strict_types=1);

/*
 * Where RIMIFY's media lives (Einstellungen › Medien und Speicher; App\Services\Storage).
 *
 * One bucket, four logical disks separated by prefix. No code names a bucket or a prefix — it names a
 * disk. The credentials come from the admin screen (stored encrypted, StorageSettings) and, where
 * none are saved there, from these environment values; with neither, the disks are local folders so
 * a development machine works without a bucket. Never a credential in this file or the repository.
 */
return [
    'disks' => [
        // Wheel photos and their derivatives (AVIF and WebP at the standard widths).
        'media_products' => ['prefix' => 'product-images', 'visibility' => 'public'],
        // Content and CMS images.
        'media_site' => ['prefix' => 'website-images', 'visibility' => 'public'],
        // Gutachten PDFs customers open.
        'docs_public' => ['prefix' => 'ABEs', 'visibility' => 'public'],
        // Invoices and credit notes; exports under exports/, uploads under review under pending/. Public
        // access blocked on the prefix by the client; served only by a signed link that expires.
        'docs_private' => ['prefix' => 'invoices', 'visibility' => 'private'],
    ],

    // The fallback credential set: `.env` only, names in `.env.example`, values never in the repo.
    's3' => [
        'key' => env('RIMIFY_S3_KEY'),
        'secret' => env('RIMIFY_S3_SECRET'),
        'region' => env('RIMIFY_S3_REGION', 'eu-north-1'),
        'bucket' => env('RIMIFY_S3_BUCKET'),
        'url' => env('RIMIFY_S3_URL'),
        'endpoint' => env('RIMIFY_S3_ENDPOINT'),
        'path_style' => (bool) env('RIMIFY_S3_PATH_STYLE', false),
    ],

    // The private disk's sub-paths.
    'private_paths' => ['exports' => 'exports', 'pending' => 'pending'],

    // A private file's link lives this long.
    'signed_url_minutes' => 10,

    // The round trip of „Verbindung testen“, on the private disk.
    'healthcheck' => '.healthcheck',

    // Uploads through the app: images up to this size; larger files (Gutachten PDFs) go straight to
    // the bucket by presigned POST.
    'upload' => [
        'image_max_kb' => 10 * 1024,
        'image_max_px' => 8000,
        // Decoded, an image takes four bytes a pixel: 40 MP is 160 MB, the most one upload may cost.
        'image_max_megapixels' => 40,
        'pdf_max_mb' => 200,
        'presign_minutes' => 10,
    ],
];
