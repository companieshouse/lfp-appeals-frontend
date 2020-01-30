export const LogPipe = <A>(log: (a: A) => void) => (a: A) => {
    log(a);
    return a;
};

export const StdPipe = <A , B>(a: A, b: B) => {
    console.log(a);
    return b;
};

