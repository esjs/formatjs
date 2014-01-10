/*
 * Copyright (c) 2011-2013, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

/*jshint node:true */
/*global describe,it */
'use strict';


var chai,
    expect,
    IntlMessageFormat;


// This oddity is so that this file can be used for both client-side and
// server-side testing.  (On the client we've already loaded chai and
// IntlMessageFormat.)
if ('function' === typeof require) {

    chai = require('chai');

    IntlMessageFormat = require('../index.js');

    require('../locale-data/en.js');
    require('../locale-data/ar.js');
    require('../locale-data/pl.js');

}
expect = chai.expect;


describe('message resolvedOptions', function () {

    it('empty options', function () {
        var msg, o, p, pCount = 0;

        msg = new IntlMessageFormat('My name is ${name}', 'en-US');

        o = msg.resolvedOptions();

        for (p in o) {
            if (o.hasOwnProperty(p)) {
                pCount++;
            }
        }

        expect(pCount).to.equal(0);
    });
});

describe('message creation', function () {

    it('simple string formatting', function () {
        var msg, m;
        msg = new IntlMessageFormat('My name is ${first} {last}.', 'en-US');
        m = msg.format({
            first: 'Anthony',
            last: 'Pipkin'
        });
        expect(m).to.equal('My name is Anthony Pipkin.');
    });

    it('simple object formatting', function () {
        var msg, m;

        msg = new IntlMessageFormat(['I have ', 2, ' cars.'], 'en-US');

        m = msg.format();

        expect(m).to.equal('I have 2 cars.');

    });

    it('simple object with post processing tokens', function () {
        var msg, m;

        msg = new IntlMessageFormat(['${', 'company', '}', ' {', 'verb' ,'}.'], 'en-US');

        m = msg.format({
            company: 'Yahoo',
            verb: 'rocks'
        });

        expect(m).to.equal('Yahoo rocks.');

    });

    it ('complex object formatter', function () {
        var msg, m;
        msg = new IntlMessageFormat(['Some text before ', {
                type: 'plural',
                valueName: 'numPeople',
                options: {
                    one: 'one',

                    few: 'few',

                    other: 'Some messages for the default'
                }
            }, ' and text after'], 'en-US');

        m = msg.format({
            numPeople: 20
        });

        expect(m).to.equal("Some text before Some messages for the default and text after");
    });

    it ('complex object formatter with invalid valueName', function () {
        var msg, m;
        msg = new IntlMessageFormat(['Some text before ', {
                type: 'plural',
                valueName: 'numPeople',
                options: {
                    one: 'one',

                    few: 'few',

                    other: 'Some messages for the default'
                }
            }, ' and text after'], 'en-US');

        try {
            m = msg.format({
                jumper: 20
            });
        } catch (e) {
            var err = new ReferenceError('The valueName `numPeople` was not found.');
            expect(e.toString()).to.equal(err.toString());
        }
    });

    it ('complex object formatter with offset', function () {
        var msg, m;
        msg = new IntlMessageFormat(['Some text before ', {
                type: 'plural',
                valueName: 'numPeople',
                offset: 1,
                options: {
                    one: 'Some message ${ph} with ${#} value',

                    few: ['Optional prefix text for |few| ', {
                        type: 'select',
                        valueName: 'gender',
                        options: {
                            male: 'Text for male option with \' single quotes',
                            female: 'Text for female option with {}',
                            other: 'Text for default'
                        }
                    }, ' optional postfix text'],

                    other: 'Some messages for the default'

                }
            }, ' and text after'],
                'pl'    // this has the "few" rule that we need
            );

        m = msg.format({
            numPeople: 1,   // offset will move this to "2" so that the "few" group is used
            ph: 'whatever',
            gender: 'male'
        });
        expect(m).to.equal("Some text before Optional prefix text for |few| Text for male option with ' single quotes optional postfix text and text after");
    });


    it('Simple string formatter using a custom formatter for a token', function () {
        var msg, m;
        msg = new IntlMessageFormat('Test formatter d: ${num:d}', null, {
                d: function (val, locale) {
                    return +val;
                }
            }, 'en-US');
        m = msg.format({
            num: '010'
        });
        expect(m).to.equal('Test formatter d: 10');
    });

    it('Simple string formatter using an inline formatter for a token', function () {
        var msg, m;
        msg = new IntlMessageFormat([{
                valueName: 'str',
                formatter: function (val, locale) {
                    return val.toString().split('').reverse().join('');
                }
            }], 'en-US');
        m = msg.format({
            str: 'aardvark'
        });
        expect(m).to.equal('kravdraa');
    });

    it('Simple string formatter using a nonexistent formatter for a token', function () {
        var msg, m;
        msg = new IntlMessageFormat('Test formatter foo: ${num:foo}', null, {
                d: function (val, locale) {
                    return +val;
                }
            }, 'en-US');

        m = msg.format({
            num: '010'
        });
        expect(m).to.equal('Test formatter foo: 010');
    });


    it('Custom formatters with hidden inheritance', function () {
        var msg, m,
            Formatters = function () {
                this.d = function (val, locale) {
                    return val + '030';
                };
            },
            CustomFormatters = function () {
                this.f = function (val, locale) {
                    return val + '080';
                };
            };

        CustomFormatters.prototype = Formatters;
        CustomFormatters.prototype.constructor = CustomFormatters;


        msg = new IntlMessageFormat('d: ${num:d} / f: ${num:f}', 'en-US', new CustomFormatters());

        m = msg.format({
            num: 0
        });

        expect(m).to.equal('d: 0 / f: 0080');
    });

    it('broken pattern', function () {
       var msg, m;

        msg = new IntlMessageFormat('${name} ${formula}', 'en-US');

        msg.pattern = '${name} ${formula}';

        m = msg.format({
            name: 'apipkin'
        });

        expect(m).to.equal('apipkin ${formula}');

    });

});


describe('message creation for plurals', function () {
    var msg = new IntlMessageFormat(['I have ', {
            type: 'plural',
            valueName: 'numPeople',
            options: {
                zero : 'zero points',
                one  : 'a point',
                two  : 'two points',
                few  : 'a few points',
                many : 'lots of points',
                other: 'some other amount of points'
            }
        }, '.'], 'ar');

    it('zero', function () {
        var m = msg.format({
            numPeople: 0
        });

        expect(m).to.equal('I have zero points.');
    });

    it('one', function () {
        var m = msg.format({
            numPeople: 1
        });

        expect(m).to.equal('I have a point.');
    });

    it('two', function () {
        var m = msg.format({
            numPeople: 2
        });

        expect(m).to.equal('I have two points.');
    });

    it('few', function () {
        var m = msg.format({
            numPeople: 5
        });

        expect(m).to.equal('I have a few points.');
    });

    it('many', function () {
        var m = msg.format({
            numPeople: 20
        });

        expect(m).to.equal('I have lots of points.');
    });

    it('other', function () {
        var m = msg.format({
            numPeople: 100
        });

        expect(m).to.equal('I have some other amount of points.');
    });
});


describe('locale switching', function () {
    var simple = {
            en: [
                { valueName: 'NAME' },
                ' went to ',
                { valueName: 'CITY' },
                '.'
            ],
            fr: [
                { valueName: 'NAME' },
                ' est ',
                {
                    type: 'gender',
                    valueName: 'gender',
                    options: {
                        female: 'allée',
                        other: 'allé'
                    }
                },
                ' à ',
                { valueName: 'CITY' },
                '.'
            ]
        },

        complex = {
            en: '${TRAVELLERS} went to ${CITY}.',
            fr: [
                '${TRAVELLERS}',
                {
                    type: 'plural',
                    valueName: 'TRAVELLER_COUNT',
                    options: {
                        one: [' est ', {
                            type: 'gender',
                            valueName: 'GENDER',
                            options: {
                                female: 'allée',
                                other: 'allé'
                            }
                        }],
                        other: [' sont ', {
                            type: 'gender',
                            valueName: 'GENDER',
                            options: {
                                female: 'allées',
                                other: 'allés'
                            }
                        }]
                    }
                },
                ' à ',
                '${CITY}',
                '.'
            ]
        },

        maleObj = {
            NAME: 'Tony',
            CITY: 'Paris',
            gender: 'male'
        },
        femaleObj = {
            NAME: 'Jenny',
            CITY: 'Paris',
            gender: 'female'
        },

        maleTravelers = {
            TRAVELLERS: 'Lucas, Tony and Drew',
            TRAVELLER_COUNT: 3,
            GENDER: 'male',
            CITY: 'Paris'
        },

        femaleTravelers = {
            TRAVELLERS: 'Monica',
            TRAVELLER_COUNT: 1,
            GENDER: 'female',
            CITY: 'Paris'
        };

    it('en-US simple', function () {
        var msg = new IntlMessageFormat(simple.en, 'en-US');

        expect(msg.format(maleObj)).to.equal('Tony went to Paris.');

        expect(msg.format(femaleObj)).to.equal('Jenny went to Paris.');
    });


    it('fr-FR simple', function () {
        var msg = new IntlMessageFormat(simple.fr, 'fr-FR');

        expect(msg.format(maleObj)).to.equal('Tony est allé à Paris.');

        expect(msg.format(femaleObj)).to.equal('Jenny est allée à Paris.');
    });

    it('en-US complex', function () {
        var msg = new IntlMessageFormat(complex.en, 'en-US');

        expect(msg.format(maleTravelers)).to.equal('Lucas, Tony and Drew went to Paris.');

        expect(msg.format(femaleTravelers)).to.equal('Monica went to Paris.');
    });


    it('fr-FR complex', function () {
        var msg = new IntlMessageFormat(complex.fr, 'fr-FR');

        expect(msg.format(maleTravelers)).to.equal('Lucas, Tony and Drew sont allés à Paris.');

        expect(msg.format(femaleTravelers)).to.equal('Monica est allée à Paris.');
    });


});

describe('locale switching with counts', function () {

    var messages = {
            en: [{
                    type: 'plural',
                    valueName: 'COMPANY_COUNT',
                    options: {
                       one: 'One company',
                       other: '${#} companies'
                    }
                },
                ' published new books.'
            ],
            ru: [{
                    type: 'plural',
                    valueName: 'COMPANY_COUNT',
                    options: {
                        one: 'Одна компания опубликовала',
                        many: '${#} компаний опубликовали',
                        other: '${#} компаний опубликовали'
                    }
                },
                ' новые книги.'
            ]
        };

    it('en-US', function () {
        var msg = new IntlMessageFormat(messages.en, 'en-US');

        expect(msg.format({COMPANY_COUNT: 0})).to.equal('0 companies published new books.');

        expect(msg.format({COMPANY_COUNT: 1})).to.equal('One company published new books.');

        expect(msg.format({COMPANY_COUNT: 2})).to.equal('2 companies published new books.');

        expect(msg.format({COMPANY_COUNT: 5})).to.equal('5 companies published new books.');

        expect(msg.format({COMPANY_COUNT: 10})).to.equal('10 companies published new books.');
    });

    it('ru-RU', function () {
        var msg = new IntlMessageFormat(messages.ru, 'ru-RU');

        expect(msg.format({COMPANY_COUNT: 0})).to.equal('0 компаний опубликовали новые книги.');

        expect(msg.format({COMPANY_COUNT: 1})).to.equal('Одна компания опубликовала новые книги.');

        expect(msg.format({COMPANY_COUNT: 2})).to.equal('2 компаний опубликовали новые книги.');

        expect(msg.format({COMPANY_COUNT: 5})).to.equal('5 компаний опубликовали новые книги.');

        expect(msg.format({COMPANY_COUNT: 10})).to.equal('10 компаний опубликовали новые книги.');
    });

});

describe('invalid lang tags', function () {
    it('empty string', function () {
        try {
            var msg = new IntlMessageFormat('{NAME}', " ");
        } catch (e) {
            var err = new RangeError('Invalid language tag.');
            expect(e.toString()).to.equal(err.toString());
        }
    });
});

describe('check tokens:', function () {
    describe('STATE:', function() {
        var msg = new IntlMessageFormat("{STATE}"),
            typeErr = new TypeError("Cannot read property 'STATE' of undefined"),
            refErr = new ReferenceError("The valueName `STATE` was not found."),
            state = 'Missouri',
            m;

        it('format()', function () {
            try {
                m = msg.format();
            } catch (e) {
                expect(e.toString()).to.equal(typeErr.toString());
            }
        });

        it('format({ FOO: "bar" })', function () {
            try {
                m = msg.format({ FOO: state });
            } catch (e) {
                expect(e.toString()).to.equal(refErr.toString());
            }
        });

        it("format({ STATE: 'Missouri' })", function () {
            try {
                m = msg.format({ STATE: state });
                expect(m).to.equal(state);
            } catch (e) {
                // should never get here
                expect(false).to.equal(true);
            }
        });

        it("format({ 'ST ATE': 'Missouri' })", function () {
            try {
                m = msg.format({ "ST ATE": state });
            } catch (e) {
                expect(e.toString()).to.equal(refErr.toString());
            }
        });

        it('format({ ST1ATE: "Missouri" })', function () {
            try {
                m = msg.format({ ST1ATE: state });
            } catch (e) {
                expect(e.toString()).to.equal(refErr.toString());
            }
        });

    });

    describe('ST ATE:', function() {
        var msg,
            rangeErr = new RangeError('No tokens were provided.'),
            state = 'Missouri',
            m;

        it('format()', function () {
            try {
                msg = new IntlMessageFormat("{ST ATE}");
                m = msg.format();
            } catch (e) {
                expect(e.toString()).to.equal(rangeErr.toString());
            }
        });
    });
    describe('ST1ATE:', function() {
        var msg = new IntlMessageFormat("{ST1ATE}"),
            typeErr = new TypeError("Cannot read property 'ST1ATE' of undefined"),
            refErr = new ReferenceError("The valueName `ST1ATE` was not found."),
            state = 'Missouri',
            m;

        it('format()', function () {
            try {
                m = msg.format();
            } catch (e) {
                expect(e.toString()).to.equal(typeErr.toString());
            }
        });

        it('format({ FOO: "bar" })', function () {
            try {
                m = msg.format({ FOO: state });
            } catch (e) {
                expect(e.toString()).to.equal(refErr.toString());
            }
        });

        it("format({ STATE: 'Missouri' })", function () {
            try {
                m = msg.format({ ST1ATE: state });
            } catch (e) {
                expect(e.toString()).to.equal(refErr.toString());
            }
        });

        it("format({ 'ST ATE': 'Missouri' })", function () {
            try {
                m = msg.format({ "ST ATE": state });
            } catch (e) {
                expect(e.toString()).to.equal(refErr.toString());
            }
        });

        it('format({ ST1ATE: "Missouri" })', function () {
            try {
                m = msg.format({ ST1ATE: state });
                expect(m).to.equal(state);
            } catch (e) {
                // should never get here
                expect(false).to.equal(true);
            }
        });

    });

    describe('multiple tokens', function () {
        it('tokens with a space should not match but not fail', function () {
            var msg = new IntlMessageFormat('The {STATE} of {ST1ATE} is {ST ATE}.');
            var m = msg.format({
                    STATE: 'description',
                    ST1ATE: 'Tennessee',
                    "ST ATE": 'long'
                });

            expect(m).to.equal('The description of Tennessee is {ST ATE}.');
        });
    });

});

