import Ember from 'ember';
import { colorForState } from 'travis/utils/helpers';
import { githubCommit } from 'travis/utils/urls';
import Polling from 'travis/mixins/polling';

export default Ember.View.extend(Polling, {
  pollModels: 'controller.job.build',
  repoBinding: 'controller.repo',
  jobBinding: 'controller.job',
  commitBinding: 'job.commit',
  currentItemBinding: 'job',

  color: function() {
    return colorForState(this.get('job.state'));
  }.property('job.state'),

  urlGithubCommit: function() {
    return githubCommit(this.get('repo.slug'), this.get('commit.sha'));
  }.property('repo.slug', 'commit.sha'),
});
