/*****
 License
 --------------
 Copyright © 2017 Bill & Melinda Gates Foundation
 The Mojaloop files are made available by the Bill & Melinda Gates Foundation under the Apache License, Version 2.0 (the "License") and you may not use these files except in compliance with the License. You may obtain a copy of the License at

 http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, the Mojaloop files are distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.

 Contributors
 --------------
 This is the official list of the Mojaloop project contributors for this file.
 Names of the original copyright holders (individuals or organizations)
 should be listed with a '*' in the first column. People who have
 contributed from an organization can be listed under the organization
 that actually holds the copyright for their contributions (see the
 Gates Foundation organization for an example). Those individuals should have
 their names indented and be marked with a '-'. Email address can be added
 optionally within square brackets <email>.

 * Gates Foundation
 - Name Surname <name.surname@gatesfoundation.com>

 * Georgi Georgiev <georgi.georgiev@modusbox.com>
 --------------
 ******/
'use strict'

const mongoose = require('../../lib/mongodb').Mongoose

const TransferFulfil = require('./individualTransferFulfil').TransferFulfil
const IndividualTransferFulfilModelFactory = require('../models/individualTransferFulfil')

let BulkTransferFulfilSchema = null

const getBulkTransferFulfilSchema = () => {
  if (!BulkTransferFulfilSchema) {
    let IndividualTransferFulfilModel = IndividualTransferFulfilModelFactory.getIndividualTransferFulfilModel()
    BulkTransferFulfilSchema = new mongoose.Schema({
      messageId: { type: String, required: true },
      headers: {
        type: Object, required: true
      },
      bulkTransferId: {
        type: String, required: true, index: true
      },
      bulkTransferState: {
        type: String, required: true
      },
      completedTimestamp: {
        type: Date, required: true
      },
      individualTransferResults: [new mongoose.Schema(Object.assign({
        _id: false
      }, TransferFulfil))],
      extensionList: {
        extension: [{
          _id: false,
          key: String,
          value: String
        }]
      }
    })
    BulkTransferFulfilSchema.pre('save', function () {
      try {
        this.individualTransferResults.forEach(async transfer => {
          try {
            if (!transfer._doc.extensionList.extension.length) {
              delete transfer._doc.extensionList
            }
            let individualTransferFulfil = new IndividualTransferFulfilModel({
              _id_bulkTransferFulfils: this._id,
              messageId: this.messageId,
              bulkTransferId: this.bulkTransferId,
              payload: transfer._doc
            })
            await individualTransferFulfil.save()
          } catch (e) {
            throw e
          }
        })
        if (!this.extensionList.extension.length) {
          delete this._doc.extensionList
        }
      } catch (e) {
        throw (e)
      }
    })
  }
  return BulkTransferFulfilSchema
}

module.exports = {
  getBulkTransferFulfilSchema
}