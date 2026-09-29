<?php

declare(strict_types=1);

namespace App\Logging;

use App\Services\Storage\StorageConfig;
use Monolog\LogRecord;
use Monolog\Processor\ProcessorInterface;

/**
 * No key reaches a log file. A context value whose name says password, token, secret or key is cut
 * to its last four characters, and anything shaped like an AWS access key id — in the message or any
 * value — too. The masked form is the one the settings screen shows: `••••••••••••WXYZ`.
 *
 * An exception's own trace is not touched here: the storage code marks every key argument
 * #[SensitiveParameter], so PHP never writes it into a trace in the first place.
 */
final class SecretRedactor implements ProcessorInterface
{
    private const NAMES = '/pass(?:word|wort)?|token|secret|authorization|cookie|credential|api[_-]?key|access[_-]?key|^key$/i';

    private const AWS_KEY_ID = '/\b(?:AKIA|ASIA)[A-Z0-9]{12}([A-Z0-9]{4})\b/';

    public function __invoke(LogRecord $record): LogRecord
    {
        return $record->with(
            message: self::text($record->message),
            context: self::walk($record->context),
            extra: self::walk($record->extra),
        );
    }

    /**
     * @param  array<array-key, mixed>  $values
     * @return array<array-key, mixed>
     */
    private static function walk(array $values): array
    {
        foreach ($values as $name => $value) {
            if (is_string($name) && preg_match(self::NAMES, $name) === 1) {
                $values[$name] = is_string($value) ? (StorageConfig::mask(StorageConfig::last4($value)) ?? '') : '[entfernt]';

                continue;
            }

            $values[$name] = match (true) {
                is_array($value) => self::walk($value),
                is_string($value) => self::text($value),
                default => $value,
            };
        }

        return $values;
    }

    private static function text(string $text): string
    {
        return (string) preg_replace(self::AWS_KEY_ID, str_repeat('•', 12).'$1', $text);
    }
}
