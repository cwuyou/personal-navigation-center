"use client"

import { useState } from "react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { 
  BookOpen, 
  Search, 
  Upload, 
  Shield, 
  Smartphone, 
  Sparkles,
  ChevronRight,
  ChevronLeft,
  X
} from "lucide-react"

interface WelcomeGuideProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const steps = [
  {
    title: "欢迎使用个人导航中心",
    subtitle: "让您的网络生活更加井然有序",
    content: (
      <div className="text-center space-y-4">
        <div className="w-20 h-20 mx-auto bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
          <BookOpen className="w-10 h-10 text-white" />
        </div>
        <p className="text-muted-foreground">
          个人导航中心是一款简洁高效的书签管理工具，帮助您轻松整理和管理常用网站。
          无论您是学生、职场人士、还是网络爱好者，都能让您的网络生活更加便捷。
        </p>
      </div>
    )
  },
  {
    title: "智能分类管理",
    subtitle: "让书签井然有序",
    content: (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Card className="p-4">
            <div className="flex items-center space-x-2 mb-2">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <BookOpen className="w-4 h-4 text-blue-600" />
              </div>
              <span className="font-medium text-sm">工作学习</span>
            </div>
            <div className="space-y-1 text-xs text-muted-foreground">
              <div>• 开发工具</div>
              <div>• 设计资源</div>
              <div>• 学习平台</div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center space-x-2 mb-2">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-green-600" />
              </div>
              <span className="font-medium text-sm">生活娱乐</span>
            </div>
            <div className="space-y-1 text-xs text-muted-foreground">
              <div>• 视频网站</div>
              <div>• 购物平台</div>
              <div>• 社交媒体</div>
            </div>
          </Card>
        </div>
        <p className="text-sm text-muted-foreground text-center">
          通过两级分类系统，您可以将书签按照用途和类型进行精细化管理
        </p>
      </div>
    )
  },
  {
    title: "核心功能特性",
    subtitle: "强大功能，简单易用",
    content: (
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-3">
          <div className="flex items-start space-x-3">
            <Search className="w-5 h-5 text-blue-500 mt-0.5" />
            <div>
              <h4 className="font-medium text-sm">快速搜索</h4>
              <p className="text-xs text-muted-foreground">秒速找到目标网站</p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <Upload className="w-5 h-5 text-green-500 mt-0.5" />
            <div>
              <h4 className="font-medium text-sm">一键导入</h4>
              <p className="text-xs text-muted-foreground">轻松迁移浏览器书签</p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <Shield className="w-5 h-5 text-purple-500 mt-0.5" />
            <div>
              <h4 className="font-medium text-sm">隐私安全</h4>
              <p className="text-xs text-muted-foreground">本地存储，保护隐私</p>
            </div>
          </div>
        </div>
        <div className="space-y-3">
          <div className="flex items-start space-x-3">
            <Smartphone className="w-5 h-5 text-orange-500 mt-0.5" />
            <div>
              <h4 className="font-medium text-sm">多设备适配</h4>
              <p className="text-xs text-muted-foreground">手机电脑都能用</p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <Sparkles className="w-5 h-5 text-pink-500 mt-0.5" />
            <div>
              <h4 className="font-medium text-sm">美观界面</h4>
              <p className="text-xs text-muted-foreground">简洁舒适的使用体验</p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <BookOpen className="w-5 h-5 text-indigo-500 mt-0.5" />
            <div>
              <h4 className="font-medium text-sm">智能分类</h4>
              <p className="text-xs text-muted-foreground">让书签井然有序</p>
            </div>
          </div>
        </div>
      </div>
    )
  },
  {
    title: "开始使用",
    subtitle: "三步轻松上手",
    content: (
      <div className="space-y-4">
        <div className="space-y-3">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">1</div>
            <span className="text-sm">点击"添加书签"创建您的第一个书签</span>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold">2</div>
            <span className="text-sm">使用"导入"功能批量导入浏览器书签</span>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-purple-500 text-white rounded-full flex items-center justify-center text-sm font-bold">3</div>
            <span className="text-sm">通过搜索和分类快速找到需要的网站</span>
          </div>
        </div>
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 rounded-lg p-4 text-center">
          <p className="text-sm text-muted-foreground">
            🎉 准备好开始您的高效网络生活了吗？
          </p>
        </div>
      </div>
    )
  }
]

export function WelcomeGuide({ open, onOpenChange }: WelcomeGuideProps) {
  const [currentStep, setCurrentStep] = useState(0)

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleClose = () => {
    setCurrentStep(0)
    onOpenChange(false)
  }

  const currentStepData = steps[currentStep]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <div className="absolute right-4 top-4">
          <Button variant="ghost" size="sm" onClick={handleClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="space-y-6 pt-2">
          {/* 进度指示器 */}
          <div className="flex justify-center space-x-2">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index === currentStep ? 'bg-primary' : 'bg-muted'
                }`}
              />
            ))}
          </div>

          {/* 内容区域 */}
          <div className="text-center space-y-2">
            <h2 className="text-xl font-bold">{currentStepData.title}</h2>
            <p className="text-muted-foreground">{currentStepData.subtitle}</p>
          </div>

          <div className="min-h-[300px] flex items-center justify-center">
            {currentStepData.content}
          </div>

          {/* 导航按钮 */}
          <div className="flex justify-between items-center pt-4 border-t">
            <Button
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 0}
              className="flex items-center space-x-2"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>上一步</span>
            </Button>

            <span className="text-sm text-muted-foreground">
              {currentStep + 1} / {steps.length}
            </span>

            {currentStep === steps.length - 1 ? (
              <Button onClick={handleClose} className="flex items-center space-x-2">
                <span>开始使用</span>
                <Sparkles className="w-4 h-4" />
              </Button>
            ) : (
              <Button onClick={nextStep} className="flex items-center space-x-2">
                <span>下一步</span>
                <ChevronRight className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
