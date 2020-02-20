import { Substitute, SubstituteOf } from '@fluffy-spoon/substitute';

export const createSubstituteOf = <T>(configureSubstitute: (substitute: SubstituteOf<T>) => void = () => {}): T => {
    const substitute = Substitute.for<T>();
    configureSubstitute(substitute);
    return substitute;
};
