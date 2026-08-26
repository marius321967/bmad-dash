/**
 * Thrown when a repo does not look like a BMAD v6 repo (missing config or
 * missing [modules.bmm] section). The provider catches this to surface the
 * "not a BMAD v6 repo" message.
 */
export class NotBmadV6Error extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NotBmadV6Error';
  }
}
