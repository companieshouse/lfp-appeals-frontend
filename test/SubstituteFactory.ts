import { Substitute, SubstituteOf } from "@fluffy-spoon/substitute";

// tslint:disable-next-line:no-empty
export const createSubstituteOf = <T>(configure: (substitute: SubstituteOf<T>) => void = () => {}): SubstituteOf<T> => {
    const substitute = Substitute.for<T>();
    configure(substitute);
    return substitute;
};
