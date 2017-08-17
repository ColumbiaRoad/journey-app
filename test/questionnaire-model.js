//this wont work if local db set up is not done
require('dotenv').config()
const expect = require('expect.js');
const db = require('../src/models/db').getDBInstance();
const shopModel = require('../src/models/shop');
const questionnaireModel = require('../src/models/questionnaire');
const winston = require('winston'); // LOGGING

describe('questionnaire model', function() {
  let shopName;
  let otherShopName;
  let questionnaire;

  before(function(done) {
    shopName = 'quesitonnaireModelTest';
    otherShopName = 'questionnaireModelTestOther';
    questionnaire = {
      rootQuestion: {
        question: 'What are you looking for?',
        answerMapping: [
          { id: 'j6ew2kx6', answer: 'This!', value: 'Test Product' },
          { id: 'j6ew2kz9', answer: 'That!', value: 'Another Product' }
        ]
      },
      selectedProducts: [
        {
          productId: 11152897108,
          questions: [
            {
              option: 'Title',
              question: 'Are you mainstream?',
              answerMapping: [
                { id: 'j6ew3la5', answer: 'Yes', value: 'Default Title' },
                { id: 'j6ew3lk1', answer: 'No', value: 'Custom Title' }
              ]
            }
          ]
        }, {
          productId: 11152891412,
          questions: [
            {
              option: 'Size',
              question: 'What fit do you prefer?',
              answerMapping: [
                { id: 'j6ew4mo1', answer: 'Loose fit', value: '42' },
                { id: 'j6ew4my8', answer: 'Regular fit', value: '40' },
                { id: 'j6ew4qs4', answer: 'Tight fit', value: '39' }
              ]
            }, {
              option: 'Color',
              question: 'Do you like to be recognized?',
              answerMapping: [
                { id: 'j6ew5cl2', answer: 'YES!', value: 'yellow' },
                { id: 'j6ew5cu6', answer: 'no', value: 'green' }
              ]
            }
          ]
        }
      ]
    };
    shopModel.saveShop(shopName, 'someAccessToken')
    .then(function(result) {
      return shopModel.saveShop(otherShopName, 'fooToken');
    })
    .then(function(res) {
      done();
    })
    .catch(function(err) {
      done(err);
    });
  });
  
  after(function(done) {
    db.none('DELETE FROM shop WHERE shop_url = $1 OR shop_url = $2',
      [shopName, otherShopName])
    .then(function(result) {
      done();
    })
    .catch(function(err) {
      done(err);
    });
  });

  it('create new questionaire', function(done) {
    questionnaireModel.createQuestionnaire(shopName)
    .then(function(result) {
      expect(result.questionnaire_id).to.be.a('number');
      done();
    })
    .catch(function(err) {
      done(err);
    });
  });

  it('save single question without passing task', function(done) {
    questionnaireModel.createQuestionnaire(shopName)
    .then(function(result) {
      const productId = questionnaire.selectedProducts[1].productId;
      const questionItem = questionnaire.selectedProducts[1].questions[0];
      return questionnaireModel.saveQuestionAndAnswers(result.questionnaire_id,
        productId, questionItem.question, questionItem.option, questionItem.answerMapping
      );
    })
    .then(function(result) {
      expect(result.questionId).to.be.above(-1);
      expect(result.savedAnswers).to.be(3);
      done();
    })
    .catch(function(err) {
      done(err);
    });
  });

  it('save questionnaire', function(done) {
    questionnaireModel.createQuestionnaire(shopName)
    .then(function(result) {
      return questionnaireModel.saveQuestionnaire(result.questionnaire_id, questionnaire);
    })
    .then(function(savedQuestionnaire) {
      const savedQuestions = savedQuestionnaire.filter(e => e.questionId);
      const questionnaire = savedQuestionnaire.find(e => e.questionnaireId);
      expect(savedQuestions.length).to.be(3);
      expect(savedQuestions.reduce((sum, elem) => {
        return sum + elem.savedAnswers;
      }, 0)).to.be(7);
      expect(questionnaire.questionnaireId).to.be.above(-1);
      done();
    })
    .catch(function(err) {
      done(err);
    });
  });

  it('get existing questionnaire', function(done) {
    questionnaireModel.createQuestionnaire(shopName)
    .then(function(result) {
      return questionnaireModel.saveQuestionnaire(result.questionnaire_id, questionnaire);
    })
    .then(function(result) {
      const questionnaire = result.find(e => e.questionnaireId);
      return questionnaireModel.getQuestionnaire(questionnaire.questionnaireId);
    })
    .then(function(result) {
      expect(result).to.eql(questionnaire);
      done();
    })
    .catch(function(err) {
      done(err);
    });
  });

  it('get non-existing questionnaire', function(done) {
    questionnaireModel.getQuestionnaire(-1)
    .then(function(result) {
      const emptyQuestionnaire = {
        rootQuestion: {
          question: '',
          answerMapping: []
        },
        selectedProducts: []
      };
      expect(result).to.eql(emptyQuestionnaire);
      done();
    })
    .catch(function(err) {
      done(err);
    });
  });

  it('get all questionnaires of a shop', function(done) {
    questionnaireModel.createQuestionnaire(otherShopName)
    .then(function(result) {
      return questionnaireModel.createQuestionnaire(otherShopName);
    })
    .then(function(result) {
      return questionnaireModel.createQuestionnaire(otherShopName);
    })
    .then(function(result) {
      return questionnaireModel.getAllQuestionnaires(otherShopName);
    })
    .then(function(result) {
      expect(result.length).to.be(3);
      done();
    })
    .catch(function(err) {
      done(err);
    });
  });

  it('update existing questionnaire', function(done) {
    const updatedQuestionnaire = {
      rootQuestion: {
        question: 'What are you looking for?',
        answerMapping: [
          { id: 'j6ew2kx7', answer: 'This!', value: 'Test Product' },
          { id: 'j6ew2la1', answer: 'That!', value: 'Another Product' }
        ]
      },
      selectedProducts: [
        {
          productId: 11152897108,
          questions: [
            {
              option: 'Title',
              question: 'Do you consider yourself mainstream?',
              answerMapping: [
                { id: 'j6ew3la5', answer: 'Yes', value: 'Default Title' },
                { id: 'j6ew3lk1', answer: 'No', value: 'Custom Title' }
              ]
            }
          ]
        }, {
          productId: 11152891412,
          questions: [
            {
              option: 'Size',
              question: 'What\'s your style?',
              answerMapping: [
                { id: 'j6ew4mo1', answer: 'Loose fit', value: '42' },
                { id: 'j6ew4my8', answer: 'Slightly loose fit', value: '41' },
                { id: 'j6ew4qs4', answer: 'Regular fit', value: '40' },
                { id: 'j6ew5tb7', answer: 'Tight fit', value: '39' }
              ]
            }, {
              option: 'Color',
              question: 'Do you like to be recognized?',
              answerMapping: [
                { id: 'j6ew5cl2', answer: 'YES!', value: 'yellow' },
                { id: 'j6ew5cu6', answer: 'no...', value: 'green' }
              ]
            }
          ]
        }
      ]
    };
    questionnaireModel.createQuestionnaire(shopName)
    .then(function(result) {
      return questionnaireModel.saveQuestionnaire(result.questionnaire_id, questionnaire);
    })
    .then(function(result) {
      const questionnaireId = result.find(e => e.questionnaireId).questionnaireId;
      return questionnaireModel.updateQuestionnaire(questionnaireId, updatedQuestionnaire);
    })
    .then(function(newQuestionnaire) {
      const savedQuestions = newQuestionnaire.filter(e => e.questionId);
      const questionnaire = newQuestionnaire.find(e => e.questionnaireId);
      expect(savedQuestions.length).to.be(3);
      expect(savedQuestions.reduce((sum, elem) => {
        return sum + elem.savedAnswers;
      }, 0)).to.be(8);
      return questionnaireModel.getQuestionnaire(questionnaire.questionnaireId); 
    })
    .then(function(result) {
      expect(result).to.eql(updatedQuestionnaire);
      done();
    })
    .catch(function(err) {
      done(err);
    });
  });

  it('delete existing questionnaire', function(done) {
    questionnaireModel.createQuestionnaire(shopName)
    .then(function(result) {
      return questionnaireModel.saveQuestionnaire(result.questionnaire_id, questionnaire);
    })
    .then(function(result) {
      const questionnaireId = result.find(e => e.questionnaireId).questionnaireId;
      return questionnaireModel.deleteQuestionnaire(questionnaireId);
    })
    .then(function(result) {
      return questionnaireModel.getQuestionnaire(result.questionnaire_id);
    })
    .then(function(result) {
      const emptyQuestionnaire = {
        rootQuestion: {
          question: '',
          answerMapping: []
        },
        selectedProducts: []
      };
      expect(result).to.eql(emptyQuestionnaire);
      done();
    })
    .catch(function(err) {
      done(err);
    });
  });

  it('delete non-existing questionnaire', function(done) {
    questionnaireModel.deleteQuestionnaire(-1)
    .then(function(result) {
      expect(result).not.to.be.ok();
      done();
    })
    .catch(function(err) {
      done(err);
    });
  });

});
