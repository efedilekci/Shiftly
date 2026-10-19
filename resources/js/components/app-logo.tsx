import AppLogoIcon from './app-logo-icon';

export default function AppLogo() {
    return (
        <>
            <div className="bg-foreground text-background flex aspect-square size-8 items-center justify-center rounded-lg">
                <AppLogoIcon className="size-5" />
            </div>
            <div className="ml-1.5 grid flex-1 text-left">
                <span className="font-display truncate text-base leading-none font-extrabold tracking-tight">Shiftly</span>
            </div>
        </>
    );
}
