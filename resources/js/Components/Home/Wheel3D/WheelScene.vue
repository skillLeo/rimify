<script setup lang="ts">
/**
 * The 3D chunk: a TresJS canvas that renders on demand only, transparent so the studio pool shows
 * through, ACES filmic tone mapping at exposure 1, sRGB out, antialiased, the device pixel ratio
 * capped at 2. Imported dynamically by WheelViewer3D after the ladder has decided on 3D — never
 * part of the initial bundle, never rendered on the server.
 */

import { TresCanvas } from '@tresjs/core'
import { ACESFilmicToneMapping, SRGBColorSpace } from 'three'
import WheelRig from './WheelRig.vue'
import type { FinishMaterial, Model3dManifest, TyreSection } from './types'

defineProps<{
    model: Model3dManifest
    hdri: string
    finish: FinishMaterial
    tyre: TyreSection | null
    roll: number
    eased: boolean
}>()

const emit = defineEmits<{ ready: []; failed: []; lost: [] }>()
</script>

<template>
    <TresCanvas
        render-mode="on-demand"
        alpha
        antialias
        :clear-alpha="0"
        :dpr="[1, 2]"
        :tone-mapping="ACESFilmicToneMapping"
        :tone-mapping-exposure="1"
        :output-color-space="SRGBColorSpace"
        @error="emit('failed')"
    >
        <WheelRig
            :model="model"
            :hdri="hdri"
            :finish="finish"
            :tyre="tyre"
            :roll="roll"
            :eased="eased"
            @ready="emit('ready')"
            @failed="emit('failed')"
            @lost="emit('lost')"
        />
    </TresCanvas>
</template>
