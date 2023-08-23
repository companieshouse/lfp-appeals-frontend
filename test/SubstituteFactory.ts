import { Substitute, SubstituteOf } from "@fluffy-spoon/substitute";

export const createSubstituteOf = <T>(configure: (substitute: SubstituteOf<T>) => void = () => {}): SubstituteOf<T> => {
    const substitute = Substitute.for<T>();
    configure(substitute);
    return substitute;
};
