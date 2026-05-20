export type GameStatus = "active" | "won" | "given_up";

export interface GameSession {
    sessionId: string;
    status: GameStatus;
    imageUrl: string;
    labels: string[];
    hints: string[];
    attempts: string[];
    createdAt: number;
    ttl: number;
}


export interface GuessBody {
    guess: string;
}


export interface NewGameResponse {
    sessionId: string;
    hint: string;
    message: string;
}

export interface GuessCorrectResponse {
    correct: true;
    message: string;
    imageUrl: string;
    labels: string[];
    totalAttempts: number;
}

export interface GuessWrongResponse {
    correct: false;
    feedback: string;
    attempts: number;
    hintsAvailable: boolean;
}

export type GuessResponse = GuessCorrectResponse | GuessWrongResponse;

export interface HintResponse {
    hint: string;
    hintNumber: number;
    hintsRemaining: number;
    message?: string;
}

export interface GiveUpResponse {
    message: string;
    imageUrl: string;
    labels: string[];
    hints: string[];
    attempts: string[];
}


export interface JudgeResult {
    correct: boolean;
    feedback?: string;
}
