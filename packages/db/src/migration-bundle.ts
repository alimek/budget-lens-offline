/** Shape of `migrations.generated.ts`: the `{ journal, migrations }` object Drizzle's expo migrator reads. */
export interface MigrationBundle {
  readonly journal: {
    readonly entries: readonly {
      readonly idx: number;
      /** Generation time in epoch ms; Drizzle applies entries newer than the last applied one. */
      readonly when: number;
      readonly tag: string;
      readonly breakpoints: boolean;
    }[];
  };
  /** SQL per entry, keyed `m0000`, `m0001`, …; statements are split at `--> statement-breakpoint`. */
  readonly migrations: Readonly<Record<string, string>>;
}
