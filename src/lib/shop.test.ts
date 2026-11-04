import assert from 'node:assert/strict'
import test from 'node:test'
import { CIRCULO_CHENILLE } from './circuloChenille'
import { findCirculoColor, getColorSwatch, getColorSwatchBackground, isKnownColorTone, parseColorTones } from './shop'

test('the Círculo table has the 42 Amigurumi Chenille colors, unique codes', () => {
  assert.equal(CIRCULO_CHENILLE.length, 42)
  assert.equal(new Set(CIRCULO_CHENILLE.map((color) => color.code)).size, 42)
  for (const color of CIRCULO_CHENILLE) assert.match(color.hex, /^#[0-9a-f]{6}$/)
})

test('a Círculo code or distinctive name in the sheet uses the Círculo tone', () => {
  assert.equal(findCirculoColor('2500')?.name, 'Acqua')
  assert.equal(findCirculoColor('2500 - Acqua')?.code, '2500')
  assert.equal(findCirculoColor('Chiclete')?.code, '3131')
  assert.equal(findCirculoColor('azul candy')?.code, '2012')
  assert.equal(getColorSwatch('Acqua'), CIRCULO_CHENILLE.find((color) => color.code === '2500')!.hex)
})

test('generic names keep the old swatch and are never mapped to a guessed Círculo tone', () => {
  for (const generic of ['Azul', 'Rosa', 'Amarelo', 'Vermelho', 'Branco', 'Preto', 'Roxo', 'Verde', 'Amarelo com rosa']) {
    assert.equal(findCirculoColor(generic), null, generic)
  }
  assert.equal(getColorSwatch('Azul'), '#4f7fc1')
  assert.equal(getColorSwatch('Rosa'), '#e89bb0')
  // With the code, white and black do use the Círculo tone.
  assert.equal(findCirculoColor('8001 Branco')?.name, 'Branco')
})

test('a blended yarn is painted as stripes, not averaged into one color', () => {
  assert.match(getColorSwatchBackground('9281 Gelato'), /^linear-gradient/)
  assert.equal(getColorSwatchBackground('Azul'), '#4f7fc1')
})

test('a bicolor piece is painted as two halves, from the second tone in its label', () => {
  assert.deepEqual(parseColorTones('Amarelo com rosa'), ['Amarelo', 'rosa'])
  assert.deepEqual(parseColorTones('Amarelo + Rosa'), ['Amarelo', 'Rosa'])
  assert.deepEqual(parseColorTones('Azul'), ['Azul'])
  assert.equal(
    getColorSwatchBackground('Amarelo com rosa'),
    'linear-gradient(90deg, #f2c94c 0 50%, #e89bb0 50% 100%)',
  )
  assert.equal(
    getColorSwatchBackground('Creme + azul'),
    'linear-gradient(90deg, #f2dfb8 0 50%, #4f7fc1 50% 100%)',
  )
})

test('a variant with no tone is hatched, never painted a guessed beige', () => {
  assert.equal(isKnownColorTone('Urso'), false)
  assert.match(getColorSwatchBackground('Urso'), /^repeating-linear-gradient/)
  assert.equal(isKnownColorTone('Amarelo com rosa'), true)
  assert.equal(getColorSwatchBackground('Verde'), '#579663')
})
