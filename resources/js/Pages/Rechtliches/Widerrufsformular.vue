<script setup lang="ts">
/**
 * The Muster-Widerrufsformular (Art. 246a § 1 Abs. 2 EGBGB), as the statute prints it — in its „Sie“, because the
 * model form is the law's text and not the shop's (WithdrawalForm on the server holds it; the order mail carries the
 * same words). The addressee is the seller's own data where given, else the e-mail address alone.
 *
 * Laid out like a form on paper: each line with room to write, the footnote under it — printable as it stands.
 */

import { Head, Link } from '@inertiajs/vue3'
import AppLayout from '../../Layouts/AppLayout.vue'

defineOptions({ layout: AppLayout, inheritAttrs: false })

defineProps<{
    title: string
    intro: string
    addressee: string
    fields: string[]
    footnote: string
}>()
</script>

<template>
    <Head :title="title" />

    <section class="section-dense">
        <div class="wrap wf">
            <p class="t-small wf__back">
                <Link href="/rechtliches/widerrufsbelehrung">Zur Widerrufsbelehrung</Link>
            </p>
            <h1 class="t-h1">{{ title }}</h1>
            <p class="t-body wf__intro">{{ intro }}</p>

            <ul class="wf__lines">
                <li class="wf__line wf__line--to">{{ addressee }}</li>
                <li v-for="field in fields" :key="field" class="wf__line">
                    <span>{{ field }}</span>
                    <span class="wf__space" aria-hidden="true" />
                </li>
            </ul>

            <p class="t-small wf__note">{{ footnote }}</p>
        </div>
    </section>
</template>

<style scoped>
.wf {
    max-width: 75ch;
}

.wf__back a {
    display: inline-flex;
    align-items: center;
    min-height: 44px;
}

.wf__intro {
    margin-top: var(--space-3);
    color: var(--ink2);
}

.wf__lines {
    display: grid;
    gap: var(--space-5);
    margin: var(--space-6) 0 0;
    padding: 0;
    list-style: none;
}

.wf__line {
    display: grid;
    gap: var(--space-2);
}

.wf__line--to {
    font-weight: 700;
}

/* The room to write, as a form on paper has it. */
.wf__space {
    display: block;
    height: var(--space-6);
    border-bottom: 1px solid var(--border-strong);
}

.wf__note {
    margin-top: var(--space-5);
    color: var(--ink2);
}
</style>
