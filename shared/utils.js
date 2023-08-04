// const mongoose = require('mongoose');
import mongoose from 'mongoose';
import { Configuration, OpenAIApi } from 'openai';
import dotenv from 'dotenv';

dotenv.config()

export async function MongoConnect() {
    try {
        mongoose.Promise = global.Promise;
        const url = 'mongodb://127.0.0.1/chatbot';
        const database = await mongoose.connect(url, { useNewUrlParser: true, useUnifiedTopology: true });
        return database;
    } catch (error) {
        console.error(error);
    }
}

export function Openai() {
    try {
        const configuration = new Configuration({
            apiKey: process.env.OPENAI_API_KEY,
        });
        const openai = new OpenAIApi(configuration);
        return openai
    } catch (error) {
        console.error(`Error when trying to connect to OpenAI: ${error}`);
    }
}

export async function callApi(messages, openai) {
    try {
        const response = await openai.createChatCompletion({
            model: "gpt-3.5-turbo",
            messages: messages,
            temperature: 1,
            max_tokens: 512,
        });
        return response.data.choices[0];
    } catch (error) {
        console.error(error);
    }
}

// module.exports = {
//     MongoConnect,
//     Openai
// };

