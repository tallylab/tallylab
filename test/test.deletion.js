describe('TallyLab', function() {
  describe('bugfix: deleteCollection doesn\'t do anything', function() {
    it('tl.collections should be empty after creating and deleting a collection', function() {
      var collection = tl.createCollection();
      tl.collections = [];
      tl.deleteCollection(collection);

      // Check if tallies are deleted too

      chai.assert.equal(0, tl.collections.length);
    });
  });
});