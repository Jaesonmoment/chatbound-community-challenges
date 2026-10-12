export type ChallengeStatus='active'|'succeeded'|'expired'|'cancelled';
export interface ChallengeStartInput{title?:unknown;consequence?:unknown;durationSec?:unknown;goalActions?:unknown}
export interface ChallengeStartOptions{title:string;consequence:string;durationSec:number;goalActions:number}
export interface Participant{readonly id:string;readonly actions:number;readonly lastPointer:'left'|'right'|null}
export interface ChallengeState extends ChallengeStartOptions{readonly eventId:string;readonly scope:string;readonly totalActions:number;readonly startsAt:number;readonly endsAt:number;readonly updatedAt:number;readonly endedAt:number|null;readonly status:ChallengeStatus;readonly participants:readonly Participant[];readonly seenMessageIds:readonly string[]}
export interface Contribution{eventId:string;scope:string;participantId:string;messageId:string;now:number;kind:'chat'|'actions'|'pointer';text?:string;actions?:number;side?:'left'|'right'}
export interface ContributionResult{state:ChallengeState;accepted:boolean;completedNow:boolean;reason:string|null}
export interface ChatMashResult{ok:boolean;rhythm:'al'|'la'|null;tokenCount:number;normalized:string;rawLetterCount:number;ignoredRepeatCount:number;ignoredSeparatorCount:number;reason?:'empty'|'too_short'|'command_like'|'other_letters'|'too_long'}
export function sanitizeChallengeStart(input?:ChallengeStartInput):ChallengeStartOptions;
export function createChallenge(input:ChallengeStartInput,identity:{eventId:string;scope:string;now:number}):ChallengeState;
export function tickChallenge(state:ChallengeState,now:number):ChallengeState;
export function cancelChallenge(state:ChallengeState,now:number):ChallengeState;
export function contribute(state:ChallengeState,input:Contribution):ContributionResult;
export function participantActions(state:ChallengeState,id:string):number;
export function parseAlLaChatMash(text:string):ChatMashResult;
export function isAlLaChatMash(text:string):boolean;
