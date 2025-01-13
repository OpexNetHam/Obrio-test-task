## Description

This project provides an **API** to upload files to **Google Drive** from an array of received URLs. It consists of two microservices that communicate using a RabbitMQ transportation layer. Clients can send an array of URLs using the **POST** request to `/files/links` and then either:
- Retrieve all uploaded files using a **GET** request to `/files/links`, or
- Check the upload status using a **GET** request to `/files/status`.

The **file-uploader microservice** leverages Google Drive's resumable upload feature to handle large files. Currently, it does not fully capitalize on resumable uploads for managing failures or resuming uploads from an interruption point.

## Main Decisions Made

For this test project, I decided to use NestJS with a microservices architecture for several reasons:

- **Efficient Handling of Bulk & Large File Uploads:**  
  Separating the API from the file-uploader ensures that the client’s HTTP request (which sends an array of file URLs) is processed immediately. This prevents request timeouts, even when dealing with very large files.

- **Separation of Concerns:**  
  The API service is solely responsible for receiving file links and providing immediate feedback about upload initiation and status. In contrast, the file-uploader service focuses on the intensive task of uploading files to Google Drive. This decoupling simplifies maintenance and testing.

- **Scalability and Flexibility:**  
  - **API Service:** Lightweight and handles quick responses without heavy processing; scaling may not be necessary initially.  
  - **File-Uploader Service:** Can be scaled independently (e.g., using Docker Compose on cloud platforms) to manage high loads or concurrent file uploads, ensuring efficient processing of individual file tasks.

- **Asynchronous Processing & Resilience:**  
  By using RabbitMQ as the communication layer, file upload tasks are queued and processed asynchronously. This setup improves resilience, as each file upload task is isolated, allowing for retries or resuming failed uploads without affecting the API's responsiveness.

- **Infrastructure Alignment with Task Requirements:**  
  Incorporating Docker Compose for deployment, and supporting relational databases (PostgreSQL or MySQL), fits well with modern development practices. This architecture is well-suited for a distributed environment where services are containerized and managed independently.

- **Future Proofing and Modular Enhancements:**  
  The modular nature of microservices readily accommodates future additions—such as an Authentication service to manage user registrations and a Notifications service to update users about upload statuses or failures—ensuring that new features can be integrated with minimal disruption.

## TODO

- **Implement Retry Mechanism:**  
  Develop a mechanism to retry or resume failed uploads, ensuring that uploads can continue from the point of interruption.

- **Add Additional Microservices:**  
  Introduce Authentication and Notifications microservices to enhance security and provide user updates.

- **Implement Rate Limiting:**  
  Add rate limiting (possibly using Redis) to prevent abuse and ensure fair resource usage.

- **Add Pagination in API Service:**  
  Implement pagination for API endpoints to handle large sets of data efficiently.

- **Increase Test Coverage:**  
  Write comprehensive tests for all microservices to ensure robustness and reliability.

- **Improve API Logging:**  
  Enhance the API logging mechanism and extend logging capabilities to all services for better monitoring and debugging.

- **Optimize Package Dependencies:**  
  Refactor the project structure to relocate the package dependencies from the root folder to the corresponding service folders. This will avoid unnecessary package duplication and improve service isolation.

- **Integrate a Linter:**  
  Add a linter to maintain code quality and enforce coding standards across the project.


## Brief thoughts about Retry Mechanism Implementation

I'm considering using RabbitMQ to schedule a task for retrying file uploads. The basic idea is to create a task whose payload includes the following:

- **originalFileUrl:** The URL of the file to be uploaded.
- **retryCount:** An integer indicating how many retries remain (with a default value for the first retry task).
- **Optional parameters:**
  - **uploadSessionUrl:** If available, used to resume an interrupted upload session.
  - **resumableStream:** Indicates whether the original URL's host supports the range header, which would allow us to start the stream from a specific offset.
  - **totalBytes:** Contains the number of bytes that have already been successfully uploaded. This value is used to determine the correct starting point for a resumed upload.

### How It Works

1. **Payload Evaluation:**  
   The consumer of the RabbitMQ task checks for the presence of `resumableStream` and `totalBytes` parameters:
   - If both parameters are present, it will determine whether to resume the upload from `totalBytes + 1` (if the host supports range requests) or start over if the range header is not supported.
   - If the parameters are not provided, it will start the upload from the beginning.

2. **Handling Retries:**  
   - In case an upload fails again, the service will emit another RabbitMQ task with the same payload, but with a decremented `retryCount`.
   - The consumer checks if the `retryCount` is still positive:
     - If yes, the retry task is executed.
     - If not, the consumer will update the file record in the database to a `FAILED` status and will not emit further retry tasks.

### Instalation

1. **Create ,env files**  
   Create .env files in microservices root folders considering .env.example files.
   
2. **Ran docker compose command**
```bash
$ docker compose up --build  
```