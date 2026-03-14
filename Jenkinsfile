pipeline {

    agent any

    environment {
        DOCKERHUB_CREDENTIALS = credentials('dockerhub-token')
        DOCKERHUB_USER        = 'hananenahim'
        IMAGE_NAME            = "${DOCKERHUB_USER}/devops-tp5"
        IMAGE_TAG             = "${BUILD_NUMBER}"
        CONTAINER_NAME        = 'devops-tp5-app'
        APP_PORT              = '8080'
    }

    options {
        timestamps()
        timeout(time: 15, unit: 'MINUTES')
        disableConcurrentBuilds()
        buildDiscarder(logRotator(numToKeepStr: '10'))
    }

    stages {

        stage('Checkout') {
            steps {
                checkout scm
                sh 'echo "Branch: $(git rev-parse --abbrev-ref HEAD)"'
                sh 'echo "Commit: $(git rev-parse --short HEAD)"'
            }
        }

        stage('Build Docker Image') {
            steps {
                sh """
                    docker build \
                        --build-arg BUILD_NUMBER=${BUILD_NUMBER} \
                        -t ${IMAGE_NAME}:${IMAGE_TAG} \
                        -t ${IMAGE_NAME}:latest \
                        .
                """
            }
        }

        stage('Push to Docker Hub') {
            steps {
                sh """
                    echo ${DOCKERHUB_CREDENTIALS_PSW} | docker login \
                        -u ${DOCKERHUB_CREDENTIALS_USR} \
                        --password-stdin
                """
                sh "docker push ${IMAGE_NAME}:${IMAGE_TAG}"
                sh "docker push ${IMAGE_NAME}:latest"
            }
            post {
                always {
                    sh 'docker logout'
                }
            }
        }

        stage('Deploy') {
            steps {
                sh """
                    docker stop ${CONTAINER_NAME} || true
                    docker rm ${CONTAINER_NAME} || true
                    docker run -d \
                        --name ${CONTAINER_NAME} \
                        --restart unless-stopped \
                        -p ${APP_PORT}:3000 \
                        -e PORT=3000 \
                        -e APP_VERSION=${IMAGE_TAG} \
                        -e BUILD_NUMBER=${BUILD_NUMBER} \
                        ${IMAGE_NAME}:${IMAGE_TAG}
                """
            }
        }

        stage('Health Check') {
            steps {
                sh 'sleep 10'
                sh """
                    STATUS=\$(curl -s -o /dev/null -w '%{http_code}' http://host.docker.internal:${APP_PORT}/health)
                    echo "Health check status: \$STATUS"
                    if [ "\$STATUS" = "200" ]; then
                        echo "App is healthy"
                    else
                        echo "Health check failed: \$STATUS"
                        exit 1
                    fi
                """
            }
        }

    }

    post {
        success {
            echo "Build #${BUILD_NUMBER} deployed successfully at http://localhost:${APP_PORT}"
        }
        failure {
            sh 'docker image prune -f || true'
        }
        always {
            sh "docker image prune -f --filter 'dangling=true' || true"
        }
    }

}
