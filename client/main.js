import { Template } from 'meteor/templating';
Template.hello.events({
  'click button'(){
    alert('Hello, digger!')
  }
})
