describe('PenaltyReferenceRouter', () => {
    it('should throw an exception if the session does not exist');
    it('should throw an exception if there is no application data');
    it('should throw an exception if the penalty list is undefined');
    it('should call redirect to the review penalty page if there is one penalty in the list');
    it('should call next if there are more than one penalty in the list');
});