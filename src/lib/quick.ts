import type { Row } from "./api";
import { sk, type Holder } from "./endpoints";
import { newAction, submitOrQueue, type ActionType, type QueuedAction } from "./offline";

const body = (a: QueuedAction): Row => {
  const { type: _t, clientActionId: _c, occurredAt: _o, label: _l, ...rest } = a;
  return rest;
};

/** Records a routine movement now, or saves it on the device when offline. Same path the Transactions screen uses. */
export function runMovement(type: ActionType, name: string, fields: Row, note?: string) {
  const action = newAction(type, `${type} ${name}`, fields, note);
  const b = body(action);
  return submitOrQueue(action, (key) => sk.transactions[type](b, key));
}

export const returnItem = (p: { itemId: string; name: string; holder: Holder; quantity?: number; condition?: string }) =>
  runMovement("checkin", p.name, { itemId: p.itemId, holder: p.holder, quantity: p.quantity, condition: p.condition });
