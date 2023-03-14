const axios = require('axios');
const FormData = require('form-data');
const token = process.env.ACCESS_TOKEN;
const fs = require('fs');
const filePath = './metafields.jsonl';
const urlApi = 'https://shopify-staged-uploads.storage.googleapis.com/';
const { logger } = require('../helper/logger.js');
// const { Base64 } = require('js-base64');

function delay(time) {
  return new Promise((resolve) => setTimeout(resolve, time));
}

const apiCall = async (query_data) => {
  const url =
    'https://reactconnection.myshopify.com/admin/api/2021-07/graphql.json';
  const headers = {
    'Content-Type': 'application/graphql',
    'X-Shopify-Access-Token': token,
  };
  return axios.post(url, query_data, { headers });
};
var step3key;
var key5;
const importquery = async () => {
  let data = new FormData();
  const query = `mutation {
        stagedUploadsCreate(input:{
          resource: BULK_MUTATION_VARIABLES,
          filename: "metafields",
          mimeType: "text/jsonl",
          httpMethod: POST
        }){
          userErrors{
            field,
            message
          },
          stagedTargets{
            url,
            resourceUrl,
            parameters {
              name,
              value
            }
          }
        }
      }`;
  // console.log('try.............');
  const urlid = await apiCall(query);
  // console.log(urlid);
  // console.log('Api calling end ');
  urlid.data.data.stagedUploadsCreate.stagedTargets[0].parameters.map(
    (item) => {
      console.log(item);
      data.append(item['name'], item['value']);
    }
  );

  step3key =
    urlid.data.data.stagedUploadsCreate.stagedTargets[0].parameters[3].value;

  console.log(
    urlid.data.data.stagedUploadsCreate.stagedTargets[0].parameters[3].value +
      'key....'
  );
  data.append('file', fs.createReadStream(filePath));
  return data;
};

const uploadJSONL = (data) => {
  console.log('CHeck1');
  // console.log(data.getHeaders());
  var config = {
    method: 'post',
    maxBodyLength: Infinity,
    url: urlApi,
    headers: {
      'Content-Type': 'application/graphql',
      'X-Shopify-Access-Token': token,
      ...data.getHeaders(),
    },
    data: data,
  };

  axios(config)
    .then(function (response) {
      console.log(JSON.stringify(response.data));
      logger.log({
        level: 'info',
        message: `Successs :  `,
      });
    })
    .catch(function (error) {
      logger.log({
        level: 'info',
        message: `Failure:  ${err},  ${item.id}`,
      });
    });

  return 'no errror';
};

const importStep3 = async () => {
  const query = `mutation {\r\n  bulkOperationRunMutation(\r\n    mutation: "mutation metafieldsSet($metafields: [MetafieldsSetInput!]!) { metafieldsSet(metafields: $metafields) { metafields { key namespace value createdAt updatedAt } userErrors { field message }\t} }",\r\n    stagedUploadPath: "${step3key}") {\r\n    bulkOperation {\r\n      id\r\n      url\r\n      status\r\n    }\r\n    userErrors {\r\n      message\r\n      field\r\n    }\r\n  }\r\n}\r\n`;

  console.log(step3key);
  console.log(query);
  const urlid = await apiCall(query);
  console.log('......................check2');
  console.log(urlid.data.data.bulkOperationRunMutation.bulkOperation.id);
  key5 = urlid.data.data.bulkOperationRunMutation.bulkOperation.id;
};

const importStep4 = async () => {
  const query = `mutation {
    webhookSubscriptionCreate(
      topic: BULK_OPERATIONS_FINISH
      webhookSubscription: {
        format: JSON,
        callbackUrl: "https://123458.ngrok.io/"}
    ) {
      userErrors {
        field
        message
      }
      webhookSubscription {
        id
      }
    }
  }`;

  console.log(query);
  const urlid = await apiCall(query);
  console.log('......................check3');
  console.log(urlid);
};

const importStep5 = async () => {
  const query = `query {
    node(id: "${key5}") {
      ... on BulkOperation {
        url
        partialDataUrl
      }
    }
  }`;

  console.log(query);
  const urlid = await apiCall(query);
  console.log('......................check4');
  console.log(urlid.data.data.node.url);
};

const importdata = async () => {
  console.log('import');
  const formData = await importquery();
  await delay(3000);
  const uploadURL = await uploadJSONL(formData);
  await delay(3000);
  const step3 = await importStep3();
  await delay(3000);
  const step4 = await importStep4();
  await delay(3000);
  const step5 = await importStep5();
  // console.log(step4);
};

module.exports = {
  importdata,
};
