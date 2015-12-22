import Ember from 'ember';

export default Ember.Service.extend({
  open(name) {
    var ref;
    this.close();
    name = (typeof event !== "undefined" && event !== null ? (ref = event.target) != null ? ref.name : void 0 : void 0) || name;
    return $("#" + name).toggleClass('display');
  },

  close() {
    var view;
    if (view = Ember.View.currentPopupView) {
      view.destroy();
      Ember.View.currentPopupView = null;
    }
    return $('.popup').removeClass('display');
  }
});
