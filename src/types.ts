/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Option {
  id: string;
  text: string;
  isCorrect: boolean;
  feedback: string;
  feedbackText?: string;
  feedbackAudioUrl?: string; // Optional file MP3 feedback
}

export interface Scenario {
  id: string;
  npcId: string; // matches NPC id on map
  npcName: string;
  npcType: string; // e.g. "stranger", "authority", "peer"
  mapId: string; // "school", "class", "street", "home"
  calloutText?: string; // short proximity lure/callout speech bubble text
  dialogueText: string;
  question: string;
  questionText?: string; // Optional question text alias
  questionAudioUrl?: string; // Optional file MP3 pertanyaan
  options: Option[];
  category: string; // e.g. "Stranger Danger", "Bullying", "Online Safety", "Traffic"
}

export interface Position {
  x: number; // percentage in grid 0-100
  y: number; // percentage in grid 0-100
}

export interface NPC {
  id: string;
  name: string;
  description: string;
  color: string; // Head/clothing colors
  position: Position;
  scenarioId: string;
  isCompleted?: boolean;
}

export interface MapData {
  id: string;
  name: string;
  title: string;
  backgroundColor: string;
  exits: {
    targetMapId: string;
    label: string;
    position: Position;
    direction: 'up' | 'down' | 'left' | 'right';
  }[];
  npcs: NPC[];
}

export interface PlayerHistory {
  scenarioId: string;
  scenarioName: string;
  category: string;
  mapName: string;
  isSolvedCorrectly: boolean;
  chosenOptionText: string;
  pointsAwarded: number;
  timestamp: string;
}

export interface StudentLog {
  id: string;
  studentName: string;
  totalPoints: number;
  completedScenariosCount: number;
  completedAt?: string;
  history: PlayerHistory[];
}

export interface PlayerState {
  name: string;
  avatarId?: string;
  points: number;
  currentMapId: string;
  completedScenarios: string[]; // list of scenario IDs
  playerPosition: Position;
  history: PlayerHistory[];
}
