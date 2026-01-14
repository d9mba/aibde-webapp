// Type declarations for CSS modules and external dependencies

declare module '*.css' {
    const content: { [className: string]: string };
    export default content;
}
