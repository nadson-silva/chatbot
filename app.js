import express from 'express';
import bodyPaser from 'body-parser';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { MongoConnect, Openai, callApi } from './shared/utils.js';
import { User } from './models/user.js';
import { ChatModel } from './models/chat.js';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(bodyPaser.json());
const port = 3000;

const secretKey = process.env.JWT_SECRET_KEY;

app.post(`/`, (req, res) => {
    res.status(201);
    res.json(req.body);
    res.end;
});

// TODO -- Add comments on the file

//  TODO -- Refactor code using genie gpt

// TODO -- Connect to Mongo DB when start the server and if the connection fails


app.post(`/login`, async (req, res) => {
    try {
        await MongoConnect();
        const result = await User.findOne({ user: req.body.user });

        if (!result) {
            res.status(401).end(); // No user found, send 401 Unauthorized
            return;
        }
        const isEqual = await bcrypt.compare(req.body.password, result.password);
        if (result.user === req.body.user && isEqual) {
            const payload = {
                _id: result._id,
                user: req.body.user,
                email: result.email
            };
            const token = jwt.sign(payload, secretKey, { expiresIn: '24h' });
            console.log(token);
            res.status(200).json({
                _id: result._id,
                user: req.body.user,
                token: token
            }).end();
        } else {
            res.status(401).end(); // Invalid password, send 401 Unauthorized
        }
    } catch (error) {
        res.status(400).end(); // Error occurred, send 400 Bad Request
        console.error(`Error: ${error}`)
    }
});



app.use('/auth', (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7); // Remove the "Bearer " prefix
        // Perform authentication/authorization logic with the token
        try {
            jwt.verify(token, secretKey);
            next(); // Proceed to the next middleware/route if authentication is successful
        } catch (error) {
            // Token is invalid or expired
            console.error(error);
            res.status(401).json({ error: 'Unauthorized' });
        }
    } else {
        // Return an error response if the header is missing or doesn't start with "Bearer"
        res.status(400).json({ error: 'Bad request' });
    }
});


app.put(`/new-user`, async (req, res) => {
    try {
        await MongoConnect();

        const password = await bcrypt.hash(req.body.password, 2);

        const newUser = new User({
            user: req.body.user,
            email: req.body.email,
            password: password
        });

        await newUser.save({ timeout: 60000 });

        console.log('Document inserted successfully');
        res.sendStatus(201);
    } catch (error) {
        console.error('Error:', error);
        res.sendStatus(500);
    }
});


app.post(`/auth/chat/message`, async (req, res) => {
    try {
        const openai = Openai();

        const authHeader = req.headers.authorization;
        const token = authHeader.substring(7);
        const tokenDecoded = jwt.verify(token, secretKey);
        let messages
        await MongoConnect();

        const result_FindOne = await ChatModel.findOne({ user: tokenDecoded.user })

        if (result_FindOne) {
            messages = result_FindOne.conversation;
            messages.push({
                role: "user",
                content: req.body.message
            });
        } else {
            messages = [
                {
                    role: "system",
                    content: "Você é o Simon, um chatbot cuja função é auxiliar um candidato a se preparar para uma entrevista de emprego"
                },
                {
                    role: "user",
                    content: req.body.message
                }
            ];
        }

        const data = await callApi(messages, openai);

        messages.push(data.message);

        await ChatModel.findOneAndUpdate(
            { user: tokenDecoded.user, email: tokenDecoded.email }, // Filter criteria
            { $set: { conversation: messages } }, // Update parameters
            { upsert: true }
        );

        res.status(200).json(data);
    } catch (error) {
        console.error(error);
        // Handle error and send appropriate response to the client
        res.status(500).json({ error: 'Internal server error' });
    } finally {
        // Remove unnecessary logging statements
        console.log('end');
    }
});


app.post('/auth/user/update', (req, res) => { }); // TODO -- Code this route

app.delete('/auth/user/delete', async (req, res) => {
    try {
        await MongoConnect();

        tokenDecoded = jwt.verify(req.header.authorization.substring(7), secretKey)

        if (req.body.user === tokenDecoded.user) {
            await User.deleteOne({ user: tokenDecoded.user })
            console.log('User deleted successfully.');
        } else {
            res.send(`Login with the account you are trying to delete!`).status(400).end();
        }

    } catch (error) {
        res.status(500).end();
        console.error(error);
    }

}); // TODO -- Code this route


app.get('/auth/chat/history', async (req, res) => {
    try {
        tokenDecoded = jwt.verify(req.header.authorization.substring(7), secretKey);
        await MongoConnect();

        result = await ChatModel.findOne({ user: tokenDecoded.user });
        res.json({
            chat: result.conversation
        }).status(200).end();
    } catch (error) {
        res.status(500).end();
    }
}); // TODO -- Code this route

// app.post('/auth/chat/update', (req, res) => { });  // TODO -- Code this route

app.post('/help', (req, res) => { });  // TODO -- Code this route



app.listen(port, () => {
    console.log(`Listening on port 3000!` +
        `\nUse "/help" to see the routes.`);
})