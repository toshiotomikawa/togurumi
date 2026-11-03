// Real colors of the Círculo Amigurumi Chenille yarn (42 colors), code and name as printed on
// circulo.com.br/produtos/amigurumi/amigurumi-chenille. Each hex was sampled from the flat
// swatch square of the site's color grid (capture of 03/11/2026): median of the mid-tone pixels
// in the central area, so neither the shadow between strands nor the shine pulls the color.
// Blended yarns (9xxx) have no single color: 	ones keeps the light base plus the main
// accents, and the swatch paints them as stripes instead of averaging them into one hex.
// Screen colors are approximate; dye lots and monitors vary.

export type CirculoColor = { code: string; name: string; hex: string; tones?: string[] }

export const CIRCULO_CHENILLE: CirculoColor[] = [
  { code: '8001', name: 'Branco', hex: '#e1e5f3' },
  { code: '8176', name: 'Off White', hex: '#ebece9' },
  { code: '1706', name: 'Flocos', hex: '#ecebd7' },
  { code: '7062', name: 'Amendoim', hex: '#c1ad9d' },
  { code: '7727', name: 'Madeira', hex: '#9f7f6a' },
  { code: '7713', name: 'Lenha', hex: '#a67459' },
  { code: '7567', name: 'Cacau', hex: '#a57d71' },
  { code: '7543', name: 'Cerâmica', hex: '#74492e' },
  { code: '7569', name: 'Brigadeiro', hex: '#4d3230' },
  { code: '7066', name: 'Pedra Quente', hex: '#8f7f73' },
  { code: '7076', name: 'Caramelito', hex: '#d2b47c' },
  { code: '7072', name: 'Centeio', hex: '#dfd19e' },
  { code: '1317', name: 'Solar', hex: '#f7d612' },
  { code: '7069', name: 'Mostarda', hex: '#d19f16' },
  { code: '7148', name: 'Craft', hex: '#a56d32' },
  { code: '7529', name: 'Terracota', hex: '#a5452f' },
  { code: '4140', name: 'Tijolo', hex: '#e0673f' },
  { code: '3635', name: 'Paixão', hex: '#ee4146' },
  { code: '3668', name: 'Veludo', hex: '#79272a' },
  { code: '3182', name: 'Pitaya', hex: '#d63e81' },
  { code: '3131', name: 'Chiclete', hex: '#c987a2' },
  { code: '3112', name: 'Penélope', hex: '#e2a79b' },
  { code: '3148', name: 'Macadâmia', hex: '#e5d1c8' },
  { code: '3077', name: 'Quartzo', hex: '#edc1e2' },
  { code: '6029', name: 'Orquídea', hex: '#a895d2' },
  { code: '6034', name: 'Realeza', hex: '#8c558e' },
  { code: '2745', name: 'Marinheiro', hex: '#022b7d' },
  { code: '2500', name: 'Acqua', hex: '#0d88de' },
  { code: '2137', name: 'Hortênsia', hex: '#96c3fb' },
  { code: '2012', name: 'Azul-Candy', hex: '#90bedf' },
  { code: '2204', name: 'Verde-Candy', hex: '#b0cdcf' },
  { code: '5083', name: 'Eco', hex: '#93b38f' },
  { code: '5442', name: 'Natureza', hex: '#405544' },
  { code: '8212', name: 'Cromado', hex: '#928f99' },
  { code: '8069', name: 'Matrix', hex: '#817a88' },
  { code: '8990', name: 'Preto', hex: '#1f252f' },
  { code: '9085', name: 'Pipoca Doce', hex: '#b0a4a9', tones: ['#b0a4a9', '#ccbc9d', '#bbab8a'] },
  { code: '9139', name: 'Safári', hex: '#dfdbca', tones: ['#dfdbca', '#cec7a4', '#b4af8b', '#92916e'] },
  { code: '9170', name: 'Pássaro', hex: '#ccd2c6', tones: ['#ccd2c6', '#cdd4a9', '#a6b6cd'] },
  { code: '9360', name: 'Café', hex: '#e3d6cf', tones: ['#e3d6cf'] },
  { code: '9281', name: 'Gelato', hex: '#ccd4d8', tones: ['#ccd4d8', '#a4c6e4', '#9ab6c2', '#73a3d3'] },
  { code: '9087', name: 'Abraço', hex: '#c0afab', tones: ['#c0afab', '#bcab92', '#ad9983', '#9c8374'] },
]
