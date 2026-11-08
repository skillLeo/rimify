<?php

declare(strict_types=1);

namespace Tests\Support\Fitment;

use ReflectionClass;

/**
 * A copy of a value object with some of its constructor's fields changed — for the engine's backstops, which a live
 * verdict never reaches because an earlier rule refuses first (D-433). Every field not named keeps the live value, so
 * the case under test differs from a real answer only where the test says it does.
 */
final class Rebuild
{
    /**
     * @template T of object
     *
     * @param  T  $object
     * @param  array<string, mixed>  $changes  constructor parameter => value
     * @return T
     */
    public static function of(object $object, array $changes): object
    {
        $class = new ReflectionClass($object);
        $arguments = [];

        foreach ($class->getConstructor()?->getParameters() ?? [] as $parameter) {
            $name = $parameter->getName();
            $arguments[$name] = array_key_exists($name, $changes) ? $changes[$name] : $object->{$name};
        }

        $unknown = array_diff(array_keys($changes), array_keys($arguments));

        if ($unknown !== []) {
            throw new \InvalidArgumentException('No such field on '.$class->getShortName().': '.implode(', ', $unknown));
        }

        return $class->newInstanceArgs($arguments);
    }
}
