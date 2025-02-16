import { Hono } from 'hono';
import { PrismaClient } from '@prisma/client/edge'
import { withAccelerate } from '@prisma/extension-accelerate'
import { z } from 'zod';
import { sign } from 'hono/jwt'

export const userRouter = new Hono<{
    Bindings : {
        DATABASE_URL : string;
        JWT_SECRET : string
    }
}>();

const signupSchema = z.object({
    name : z.string(),
    email : z.string().email(),
    password : z.string()
});

userRouter.post('/signup', async (c) => {
    const prisma = new PrismaClient({
        datasourceUrl : c.env.DATABASE_URL
    }).$extends(withAccelerate());
    
    try {
        const body = await c.req.json();
        const { success } = signupSchema.safeParse(body);
        if(!success){
            throw new Error('invalid inputs');
        }

        const user = await prisma.user.create({
            data : { ...body }
        });
        const token = await sign({id: user.id, email: user.email}, c.env.JWT_SECRET);
        return c.json({
            user,
            message : "user created successfully",
            token
        });
    } catch (err) {
        c.status(403);
        return c.json({
            message : `${err}`
        });   
    }
});

const signinSchema = z.object({
    email : z.string(),
    password : z.string()
});

userRouter.post('/signin', async (c) => {
    const prisma = new PrismaClient({
        datasourceUrl : c.env.DATABASE_URL
    }).$extends(withAccelerate());

    try {
        const body = await c.req.json();
        const { success } = signinSchema.safeParse(body);
        if(!success){
            throw new Error('invalid inputs');
        }

        const user = await prisma.user.findFirst({
            where : { ...body}
        });
        if(!user){
            throw new Error("user not found!");
        }
        const token = await sign({id: user.id, email: user.email}, c.env.JWT_SECRET);
        return c.json({
            message : "signed in successfully!",
            token
        });
    } catch (err) {
        c.status(403);
        c.json({
            message : `${err}`
        });
    }
})