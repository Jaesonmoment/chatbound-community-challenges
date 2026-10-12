export { parseAlLaChatMash, isAlLaChatMash } from './chat-mash-parser.js';
import { parseAlLaChatMash } from './chat-mash-parser.js';
const DEFAULT_TITLE = 'Community goal';
const DEFAULT_CONSEQUENCE = 'The community goal is complete.';
const MIN_DURATION_SEC = 15;
const MAX_DURATION_SEC = 300;
const MIN_GOAL_ACTIONS = 10;
const MAX_GOAL_ACTIONS = 10_000;
const MAX_TITLE_LENGTH = 80;
const MAX_CONSEQUENCE_LENGTH = 180;
function cleanText(value, fallback, maxLength) {
    const text = typeof value === 'string' ? value.replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim() : '';
    return (text || fallback).slice(0, maxLength);
}
function cleanWholeNumber(value, fallback, min, max) {
    const numberValue = typeof value === 'number' ? value : typeof value === 'string' ? Number(value) : NaN;
    if (!Number.isFinite(numberValue))
        return fallback;
    return Math.max(min, Math.min(max, Math.round(numberValue)));
}
export function sanitizeChallengeStart(input = {}) {
    input = input && typeof input === "object" ? input : {};
    return {
        title: cleanText(input.title, DEFAULT_TITLE, MAX_TITLE_LENGTH),
        consequence: cleanText(input.consequence, DEFAULT_CONSEQUENCE, MAX_CONSEQUENCE_LENGTH),
        durationSec: cleanWholeNumber(input.durationSec, 45, MIN_DURATION_SEC, MAX_DURATION_SEC),
        goalActions: cleanWholeNumber(input.goalActions, 100, MIN_GOAL_ACTIONS, MAX_GOAL_ACTIONS),
    };
}

const validId=value=>typeof value==='string' && value.length>0 && value.length<=128 && !/[\u0000-\u0020\u007f]/.test(value);
const validTime=value=>Number.isSafeInteger(value) && value>=0;
function freezeState(state) {
    state.participants.forEach(Object.freeze);
    Object.freeze(state.participants);
    Object.freeze(state.seenMessageIds);
    return Object.freeze(state);
}
/** Explicit IDs and seconds make transitions replayable. No storage or clocks are read. */
export function createChallenge(input={}, {eventId,scope,now}={}) {
    if (!validId(eventId) || !validId(scope) || !validTime(now)) throw new TypeError('Valid eventId, scope and nonnegative safe-integer time required');
    const options=sanitizeChallengeStart(input);
    if (!Number.isSafeInteger(now+options.durationSec)) throw new RangeError('End time exceeds safe range');
    return freezeState({...options,eventId,scope,totalActions:0,startsAt:now,endsAt:now+options.durationSec,updatedAt:now,endedAt:null,status:'active',participants:[],seenMessageIds:[]});
}
export function tickChallenge(state,now) {
    if (!validTime(now) || now<state.updatedAt) return state;
    if (state.status!=='active') return state;
    if (now>=state.endsAt) return freezeState({...state,status:'expired',endedAt:now,updatedAt:now,participants:[...state.participants],seenMessageIds:[...state.seenMessageIds]});
    return state;
}
export function cancelChallenge(state,now) {
    state=tickChallenge(state,now);
    if (!validTime(now) || now<state.updatedAt || state.status!=='active') return state;
    return freezeState({...state,status:'cancelled',endedAt:now,updatedAt:now,participants:[...state.participants],seenMessageIds:[...state.seenMessageIds]});
}
/** Derives one immutable next snapshot. Store it through one owner before accepting another input. */
export function contribute(state,input) {
    const rejected=(reason,next=state)=>({state:next,accepted:false,completedNow:false,reason});
    if (!input || !validTime(input.now) || input.now<state.updatedAt || input.now<state.startsAt) return rejected('invalid-time');
    if (input.eventId!==state.eventId || input.scope!==state.scope) return rejected('wrong-event');
    state=tickChallenge(state,input.now);
    if (state.status!=='active') return rejected('inactive',state);
    if (!validId(input.participantId) || !validId(input.messageId)) return rejected('invalid-identity',state);
    if (state.seenMessageIds.includes(input.messageId)) return rejected('duplicate',state);
    const oldParticipant=state.participants.find(person=>person.id===input.participantId);
    let amount,lastPointer=oldParticipant?.lastPointer??null;
    if (input.kind==='chat') {
        const parsed=parseAlLaChatMash(input.text);
        if (!parsed.ok) return rejected('invalid-chat',state);
        amount=parsed.tokenCount;
    } else if (input.kind==='actions') {
        if (typeof input.actions!=='number' || !Number.isFinite(input.actions) || input.actions<=0) return rejected('invalid-actions',state);
        amount=Math.max(1,Math.min(140,Math.floor(input.actions)));
    } else if (input.kind==='pointer') {
        if (!['left','right'].includes(input.side)) return rejected('invalid-pointer',state);
        if (lastPointer===input.side) return rejected('repeated-pointer',state);
        lastPointer=input.side;amount=1;
    } else return rejected('invalid-kind',state);
    amount=Math.min(amount,state.goalActions-state.totalActions);
    const participant={id:input.participantId,actions:(oldParticipant?.actions??0)+amount,lastPointer};
    const participants=state.participants.filter(person=>person.id!==input.participantId).concat(participant);
    const totalActions=state.totalActions+amount,completedNow=totalActions===state.goalActions;
    const next=freezeState({...state,totalActions,updatedAt:input.now,status:completedNow?'succeeded':'active',endedAt:completedNow?input.now:null,participants,seenMessageIds:[...state.seenMessageIds,input.messageId]});
    return {state:next,accepted:true,completedNow,reason:null};
}
export function participantActions(state,id) {
    return state.participants.find(participant=>participant.id===id)?.actions??0;
}
