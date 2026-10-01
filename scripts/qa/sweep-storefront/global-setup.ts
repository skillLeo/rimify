import { mkdirSync, rmSync } from 'node:fs';
import { OUT, SHOTS, STATE } from './support';

/** A fresh run: last run's findings, order hand-over and screenshots go, so nothing stale is read as today's. */
export default async function globalSetup(): Promise<void> {
    rmSync(OUT, { recursive: true, force: true });
    rmSync(SHOTS, { recursive: true, force: true });
    rmSync(STATE, { recursive: true, force: true });
    mkdirSync(OUT, { recursive: true });
    mkdirSync(SHOTS, { recursive: true });
    mkdirSync(STATE, { recursive: true });
}
