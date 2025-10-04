export enum ACTIONS {
  ADD_MEASUREMENT = 'add_measurement',
  LIST_PEOPLE = 'list_people',
  ADD_PERSON = 'add_person',
  MENU = 'menu',
  CANCEL = 'cancel',
  MESSAGE = 'message',
}

export type User = {
  id: number;
  chatId: number;
  name: string;
}

export type Person = {
  id: number;
  name: string;
  userId: number;
}

export type Measurement = {

}