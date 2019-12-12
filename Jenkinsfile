#!groovy

node('docker') {
  step([$class: 'StashNotifier'])

  try {
    checkout scm
    sh 'git clean -dxf'

    docker.image('node:12.13-alpine').inside {
      withEnv(["HOME=${env.WORKSPACE}"]) {
        sh 'npm install'

        stage('Build') {
          sh 'npx vsce package'
          archive '*.vsix'
        }
      }
    }

    currentBuild.result = 'SUCCESS'
  } catch (e) {
    currentBuild.result = 'FAILED'
    println(e)
    throw e
  } finally {
    step([$class: 'StashNotifier'])
  }
}
