export const EventType = {
  BuiltinSound: 'BuiltinSound',
} as const;

export type BuiltinSound = {
  event: typeof EventType.BuiltinSound;
  sound: number,
};
export const BuiltinSound = {
  from(sound: number): BuiltinSound {
    return {
      event: EventType.BuiltinSound,
      sound,
    };
  }
}

export type Event = {
  [EventType.BuiltinSound]: BuiltinSound,
};
