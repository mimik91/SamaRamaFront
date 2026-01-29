declare module 'klaro/dist/klaro-no-css' {
  export interface Config {
    [key: string]: unknown;
  }
  export function setup(config: Config): void;
  export function show(config?: Config, modal?: boolean): void;
  export function hide(): void;
  export function getManager(config?: Config): unknown;
}

declare module 'klaro/dist/klaro.css';
