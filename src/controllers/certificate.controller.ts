import { Request, Response } from "express";
import { ollamaNoStream, ollamaStream } from "../service/ollamaChat";
import { AppDataSource } from "../config";
import { Roadmap } from "../entity/roadmap.entity";
import { UserInfo } from "../entity/user.entity";
import { extractArrayRoadmap } from "../utils/roadMap"
import { Milestone } from "../entity/milestone.entity";


export const generateCertificate = async (req: Request, res: Response) => {
    const { userId , coursename } = req.body;
    const roadmapRepo = AppDataSource.getRepository(Roadmap);
    const milestoneRepo = AppDataSource.getRepository(Milestone);
    const userRepo =  AppDataSource.getRepository(UserInfo);


    try {
        const user = await userRepo.findOne({ where: {id: req.user?.id}})
        if(!user){
            return res.status(404).json({
                message: "user not found",
            });
        }
        const roadMap = new Roadmap()
        roadMap.user = userId
        roadMap.title = coursename
       await roadmapRepo.save(roadMap)
     
        const qury =`

        You are a helpful coding assistant. I want you to create a exercise quizzes in the form of an array of objects. Each object should contain 3 properties: 
        - 'question': the question base on topic of user input.
        - 'options': 5 options, 4 incorrect answer and for correct answer.
        - 'correctAnswer': the correction answer.

        Your response only be in this format without any other text outside of array:
        [
        {
            "question": "question 1",
            "options": ["option 1", "option 2", "option 3", "option 4", "option 5"] 
            "correctAnswer": "correct option"
        },
        ]

        Now, create a ${ userId } roadmap.
        `
        
        const response = await ollamaNoStream([{role: 'admin', content: qury}])
        const milestoneArray = extractArrayRoadmap(response.message.content) ?? []

        for(const item of milestoneArray ){
            const milestone = new Milestone()
            milestone.roadmap = roadMap
            milestone.title = item.title
            milestone.description = item.description
         await milestoneRepo.save(milestone)
        }

        res.status(200).json({
            "roadmapId":roadMap.id,
            "title": userId,
            "milestones": milestoneArray
        });

    } catch (error) {
        console.error(error);
        res.write(`data: ${JSON.stringify({ error: "Internal server error", details: error})}`);
    }
}




// //Get All
// export const get = async (req: Request, res: Response) => {
//     try {
//         const roadmapRepo = AppDataSource.getRepository(Roadmap);
//         const roadmap = await roadmapRepo.find();
//         return res.status(200).json({ message: "All roadmap successfully.", data: roadmap});
//     } catch (error) {
//         console.error(error);
//         return res.status(500).json({ message: "Error fetching data", error: error});
//     }
// };