/**
 * THE GHOST CIRCUIT (Social Proof Engine)
 * Objective: Generate thousands of unique, hyper-real social interactions.
 */

export const VISUAL_COMMENTS = [
  "klk mor, estas rompiendo 🔥",
  "nenaaaa literal, amo tu vibe ✨",
  "que flowww, santiago en la casa 🇩🇴",
  "la mas dura de tulum 🌊",
  "ese outfit es otro nivel",
  "me muero, que bella",
  "puro fuego medallo style",
  "esa mirada dice todo...",
  "parce que nivel de mujer",
  "esa sonrisa es ilegal",
  "quien te viera asi de tranquila...",
  "la mas linda de toda la isla",
  "puro veneno en esa foto 🤔🔥"
];

export const TEXT_COMMENTS = [
  "parceee esa energía es todo",
  "medallo activeeeee. dímelo mor",
  "un brindis por esa reina 🥂",
  "stalking me? te veo 👀",
  "locura total, bendiciones bebe",
  "el que sabe, sabe",
  "la jefa. punto.",
  "te veo ganando amor",
  "klk bebe, que hay de nuevo?",
  "medallo extrañandote...",
  "nada mas que decir. perfecta.",
  "que chimba de vida mor",
  "totalmente de acuerdo",
  "literal yo mañana",
  "quien fuera tu para estar asi de relajada",
  "esa voz me mataaa mor 🎙️",
  "dímelo cantando jajaja",
  "klk con esa nota de voz?",
  "te escucho y me derrito",
  "siempre con la mejor vibra",
];

export const LIKE_TRIGGER_MESSAGES = [
  "stalking me? te veo 👀",
  "viste algo que te gusto?",
  "hola bebe... vi que te gusto mi post",
  "que haces tan perdido?",
  "klk mor, gracias por el amor en el feed",
  "te veo activo hoy...",
  "pense que te habias olvidado de mi",
  "buscas problemas o que? 😂",
  "estas pendiente de todo lo que subo eh",
  "te gusto la foto verdad?",
  "hey... te veo por aqui de nuevo",
  "que tal tu dia mor?",
  "me encanto que pasaras a saludar (con el corazon)",
  "un beso para mi fan numero 1",
  "ya casi me alcanzas con tantos likes"
];

import { initialPersonas } from './profiles';

export function getRandomComments(count: number = 2, type: 'visual' | 'text' = 'visual') {
  const source = type === 'visual' ? VISUAL_COMMENTS : TEXT_COMMENTS;
  const shuffled = [...source].sort(() => 0.5 - Math.random());
  
  return shuffled.slice(0, count).map((text, i) => {
    const persona = initialPersonas[Math.floor(Math.random() * initialPersonas.length)];
    return {
      id: persona.id,
      name: persona.name,
      avatar: persona.image,
      isOnline: persona.status === 'online',
      text: text,
      color: i % 2 === 0 ? '#ff00ff' : '#00f0ff'
    };
  });
}

export function getRandomLikeDM() {
  return LIKE_TRIGGER_MESSAGES[Math.floor(Math.random() * LIKE_TRIGGER_MESSAGES.length)];
}


