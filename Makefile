PROJECT_ID = daily-report-496810
REGION     = asia-northeast1
SERVICE    = daily-report
REPO       = $(REGION)-docker.pkg.dev/$(PROJECT_ID)/$(SERVICE)
IMAGE      = $(REPO)/app

.PHONY: build push deploy setup-repo

## Artifact Registry リポジトリ作成（初回のみ）
setup-repo:
	gcloud artifacts repositories create $(SERVICE) \
		--repository-format=docker \
		--location=$(REGION) \
		--project=$(PROJECT_ID)

## Dockerイメージをビルド
build:
	docker build -t $(IMAGE) .

## Artifact Registry へ push
push:
	gcloud auth configure-docker $(REGION)-docker.pkg.dev --quiet
	docker push $(IMAGE)

## Cloud Run へデプロイ
deploy:
	gcloud run deploy $(SERVICE) \
		--image=$(IMAGE) \
		--region=$(REGION) \
		--project=$(PROJECT_ID) \
		--platform=managed \
		--allow-unauthenticated \
		--port=8080

## ビルド → push → デプロイ を一括実行
release: build push deploy
