// Mounts the real WheelScene twice — the hero (rim, eased cursor roll) and the band (rim + tyre,
// direct scroll roll) — and exposes handles for run.mjs. Never part of the application bundle.
import { createApp, defineComponent, h, ref } from 'vue';
import WheelScene from '@/Components/Home/Wheel3D/WheelScene.vue';
import { HERO_MODEL_3D } from '@/Components/Home/Wheel3D/model';
import { finishFor } from '@/Components/Home/Wheel3D/finish';

declare global {
    interface Window {
        __harness: {
            ready: boolean;
            bandReady: boolean;
            failed: string[];
            setRoll: (deg: number) => void;
            setBandRoll: (deg: number) => void;
        };
        __rimifyViewerRaf?: number;
    }
}

const roll = ref(0);
const bandRoll = ref(0);

window.__harness = {
    ready: false,
    bandReady: false,
    failed: [],
    setRoll: (deg) => {
        roll.value = deg;
    },
    setBandRoll: (deg) => {
        bandRoll.value = deg;
    },
};

const Hero = defineComponent({
    setup() {
        return () =>
            h(WheelScene, {
                model: HERO_MODEL_3D,
                hdri: '/3d/studio_small_09_1k.hdr',
                finish: finishFor('Silber'),
                tyre: null,
                roll: roll.value,
                eased: true,
                onReady: () => {
                    window.__harness.ready = true;
                },
                onFailed: () => window.__harness.failed.push('hero'),
                onLost: () => window.__harness.failed.push('hero-lost'),
            });
    },
});

const Band = defineComponent({
    setup() {
        return () =>
            h(WheelScene, {
                model: HERO_MODEL_3D,
                hdri: '/3d/studio_small_09_1k.hdr',
                finish: finishFor('Silber'),
                tyre: { widthMm: 225, aspect: 45 },
                roll: bandRoll.value,
                eased: false,
                onReady: () => {
                    window.__harness.bandReady = true;
                },
                onFailed: () => window.__harness.failed.push('band'),
                onLost: () => window.__harness.failed.push('band-lost'),
            });
    },
});

createApp(Hero).mount('#hero');
createApp(Band).mount('#band');
