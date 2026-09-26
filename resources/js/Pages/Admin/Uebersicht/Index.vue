<script setup lang="ts">
/**
 * Übersicht: the figures that say how the shop is doing, for the areas this role may open
 * (UebersichtController). The thin first version the brief allows — real numbers only; charts and
 * work lists arrive with the dashboards step, once there is data and a list behind them.
 */

import AdminLayout from '../../../Layouts/AdminLayout.vue'
import AdminPage from '../../../Components/Admin/AdminPage.vue'
import AdminStatTile from '../../../Components/Admin/AdminStatTile.vue'
import AdminState from '../../../Components/Admin/AdminState.vue'
import type { AdminUebersichtProps } from '../../../types/pages'

defineOptions({ layout: AdminLayout, inheritAttrs: false })

defineProps<AdminUebersichtProps>()
</script>

<template>
    <AdminPage title="Übersicht" :context="`Stand ${asOf}`">
        <section v-if="tiles.length" class="adm-stats" aria-label="Kennzahlen">
            <AdminStatTile v-for="tile in tiles" :key="tile.key" :label="tile.label" :value="tile.value" :href="tile.href" />
        </section>

        <AdminState v-else kind="empty" text="Für deine Rolle gibt es hier noch keine Kennzahlen. Deine Bereiche findest du in der Navigation." />
    </AdminPage>
</template>
