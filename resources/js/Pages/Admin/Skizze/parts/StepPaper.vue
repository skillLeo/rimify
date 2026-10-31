<script setup lang="ts">
/**
 * Step 1, Gutachten (the brief §7): the PDF, the Art and the number are all a paper needs to start; date and issuer are
 * optional; everything else is folded under „Weitere Angaben" — including how the paper gives load index and speed
 * symbol, which step 5 asks if nobody answered it here.
 */

import { computed, ref } from 'vue'
import Icon from '../../../../Components/Admin/AdminIcon.vue'
import DateField from '../../../../Components/Admin/DateField.vue'
import { PAPER } from '../gutachtenDemo'
import { useSketch, type ArtValue, type LiSource } from '../gutachtenStore'

const { state, go } = useSketch()

const ARTS: ArtValue[] = ['ABE', 'Teilegutachten', 'EG-Genehmigung']

const LI_SOURCES: { value: LiSource; label: string }[] = [
    { value: 'document', label: 'Bei jeder Reifengröße' },
    { value: 'papers', label: 'Mit einem Verweis auf die Fahrzeugpapiere' },
    { value: 'table', label: 'In einer Tabelle zur Tragfähigkeit bei hoher Geschwindigkeit' },
]

const tried = ref(false)
const numberError = computed(() => (tried.value && state.number.trim() === '' ? 'Die Nummer fehlt. Gib sie so ein, wie sie im Gutachten steht.' : ''))
const replaced = ref(false)

function next(): void {
    tried.value = true

    if (numberError.value === '') {
        go(1)
    }
}
</script>

<template>
    <section class="sk-step" aria-labelledby="sk-paper-h">
        <h2 id="sk-paper-h" class="adm-section__title" tabindex="-1">Gutachten</h2>
        <p class="adm-note">Nur das PDF, die Art und die Nummer sind nötig. Alles andere ist freiwillig.</p>

        <div class="sk-paper">
            <div class="form-field">
                <span id="sk-pdf-label" class="form-field__label">PDF des Gutachtens</span>
                <div class="sk-file" aria-describedby="sk-pdf-label">
                    <Icon name="documents" :size="20" />
                    <span class="sk-file__name">{{ PAPER.file }}</span>
                    <span class="sk-file__meta">{{ PAPER.pages }} Seiten · hochgeladen</span>
                    <button class="btn btn--ghost" type="button" @click="replaced = true">Ersetzen</button>
                </div>
                <p v-if="replaced" class="form-field__help" role="status">In der Skizze wird keine Datei hochgeladen.</p>
            </div>

            <fieldset class="form-field sk-fieldset">
                <legend class="form-field__label">Art</legend>
                <div class="sk-seg" role="radiogroup" aria-label="Art">
                    <label v-for="art in ARTS" :key="art" class="adm-chip">
                        <input v-model="state.art" class="visually-hidden" type="radio" name="sk-art" :value="art">
                        {{ art }}
                    </label>
                </div>
            </fieldset>

            <div class="sk-pair">
                <div class="form-field">
                    <label class="form-field__label" for="sk-number">Nummer</label>
                    <input
                        id="sk-number"
                        v-model="state.number"
                        class="input"
                        type="text"
                        maxlength="64"
                        spellcheck="false"
                        :aria-invalid="numberError ? 'true' : undefined"
                        aria-describedby="sk-number-help sk-number-err"
                    >
                    <p id="sk-number-help" class="form-field__help">Wie im Gutachten gedruckt, z. B. die KBA-Nummer der ABE.</p>
                    <p id="sk-number-err" class="form-field__error">{{ numberError }}</p>
                </div>
                <div class="form-field">
                    <label class="form-field__label" for="sk-date">Ausgestellt am <span class="sk-optional">(optional)</span></label>
                    <DateField id="sk-date" v-model="state.issuedOn" />
                </div>
            </div>

            <div class="form-field">
                <label class="form-field__label" for="sk-issuer">Aussteller <span class="sk-optional">(optional)</span></label>
                <input id="sk-issuer" v-model="state.issuer" class="input sk-wide" type="text" maxlength="120" placeholder="z. B. TÜV Austria">
            </div>

            <details class="sk-more">
                <summary class="sk-more__summary">Weitere Angaben <span class="sk-optional">(optional)</span></summary>
                <div class="sk-more__body">
                    <div class="form-field">
                        <label class="form-field__label" for="sk-supplement">Nachtrag oder Fassung</label>
                        <input id="sk-supplement" v-model="state.supplement" class="input sk-wide" type="text">
                    </div>
                    <div class="sk-grid">
                        <div v-for="field in ['Anlage', 'Prüfbericht-Nr.', 'Ausfertigung', 'Benennungsnummer', 'Prüfort', 'Prüfdatum', 'Gültig ab Fertigungsdatum']" :key="field" class="form-field">
                            <label class="form-field__label" :for="`sk-more-${field}`">{{ field }}</label>
                            <input :id="`sk-more-${field}`" v-model="state.more[field]" class="input" type="text">
                        </div>
                    </div>
                    <fieldset class="form-field sk-fieldset">
                        <legend class="form-field__label">Wie gibt das Gutachten Lastindex und Geschwindigkeitssymbol an?</legend>
                        <label v-for="option in LI_SOURCES" :key="option.value" class="check">
                            <input v-model="state.liSource" type="radio" name="sk-li" :value="option.value">
                            {{ option.label }}
                        </label>
                        <p class="form-field__help">Lässt du das offen, fragt Schritt 5 danach – mit einem Vorschlag aus den eingetragenen Reifen.</p>
                    </fieldset>
                </div>
            </details>
        </div>

        <div class="sk-actions">
            <button class="btn btn--primary" type="button" @click="next">
                Weiter: Felge
                <Icon name="arrow-right" :size="20" />
            </button>
        </div>
    </section>
</template>

<style scoped>
.sk-paper {
    display: grid;
    gap: var(--sp-20);
    max-width: var(--adm-form-max);
    margin-top: var(--sp-20);
}

.sk-file {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--sp-8) var(--sp-12);
    padding: var(--sp-12) var(--sp-16);
    border: 1px solid var(--c-line);
    border-radius: var(--r-control);
    background: var(--c-surface);
}

.sk-file__name {
    font-weight: 600;
}

.sk-file__meta {
    flex: 1;
    color: var(--c-ink-2);
    font-size: var(--fs-small);
}

.sk-seg {
    display: flex;
    flex-wrap: wrap;
    gap: var(--sp-8);
}

.sk-pair {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(min(100%, 220px), 1fr));
    gap: var(--sp-16);
}

.sk-wide {
    width: 100%;
}

.sk-more {
    border-top: 1px solid var(--c-line);
    padding-top: var(--sp-12);
}

.sk-more__summary {
    font-weight: 600;
    cursor: pointer;
}

.sk-more__body {
    display: grid;
    gap: var(--sp-16);
    margin-top: var(--sp-16);
}

.sk-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(min(100%, 200px), 1fr));
    gap: var(--sp-16);
}
</style>
